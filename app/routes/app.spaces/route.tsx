import { parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, json } from "@remix-run/node";
import {
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import ShortUniqueId from "short-unique-id";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import prisma from "~/lib/prisma.server";
import { s3Client } from "~/lib/s3.server";
import { useForm } from "@conform-to/react";
import toast from "react-hot-toast";

export const schema = z.object({
  name: z.string(),
  description: z.string(),
  smplrSpaceId: z.string(),
  imagePreview: z.instanceof(File, { message: "Image preview is required" }),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const submission = parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return json({
      success: false,
      lastResult: submission.reply(),
      data: null,
      timestamp: new Date(),
    });
  }

  const { description, imagePreview, name, smplrSpaceId } = submission.value;

  const uid = new ShortUniqueId({ length: 10 });
  const fileName = `spaces/${uid}.${imagePreview.name.split(".").slice(-1)}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: Buffer.from(await imagePreview.arrayBuffer()),
    ContentType: imagePreview.type,
    ACL: "public-read",
  });

  await s3Client.send(command);

  const url = `${process.env.S3_END_POINT}/${process.env.S3_BUCKET_NAME}/${fileName}`;

  const space = await prisma.space.create({
    data: { name, description, smplrSpaceId, imagePreview: url },
  });

  return json({
    success: true,
    lastResult: submission.reply(),
    data: {
      space,
    },
    timestamp: new Date(),
  });
}

export async function loader() {
  const spaces = await prisma.space.findMany({
    orderBy: {
      id: "asc",
    },
  });
  return json({ spaces });
}

export default function Spaces() {
  const actionData = useActionData<typeof action>();
  const { spaces } = useLoaderData<typeof loader>();
  const [openAddModal, setOpenAddModal] = useState(false);
  const fetcher = useFetcher<typeof action>();
  const spaceId = fetcher.data?.data?.space.id;
  const submitting = fetcher.state === "submitting";

  useEffect(() => {
    if (spaceId) {
      setOpenAddModal(false);
      toast.success("New space created!");
    }
  }, [spaceId]);

  const [form, fields] = useForm({
    lastResult: actionData?.lastResult,
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <main className="max-w-7xl w-full mx-auto py-6 px-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Spaces</h1>
        <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
          <DialogTrigger asChild>
            <Button>Create New Space</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Space</DialogTitle>
            </DialogHeader>
            <fetcher.Form
              method="post"
              encType="multipart/form-data"
              id={form.id}
              onSubmit={form.onSubmit}
              className="space-y-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" />
                {fields.name.errors ? (
                  <p
                    role="alert"
                    className="text-sm font-semibold text-red-600"
                  >
                    {fields.name.errors}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
                {fields.description.errors ? (
                  <p
                    role="alert"
                    className="text-sm font-semibold text-red-600"
                  >
                    {fields.description.errors}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smplrSpaceId">Smplrspace Space ID</Label>
                <Input id="smplrSpaceId" name="smplrSpaceId" />
                {fields.smplrSpaceId.errors ? (
                  <p
                    role="alert"
                    className="text-sm font-semibold text-red-600"
                  >
                    {fields.smplrSpaceId.errors}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imagePreview">Image Previce</Label>
                <Input
                  id="imagePreview"
                  name="imagePreview"
                  type="file"
                  accept="image/png, image/jpeg"
                />
                {fields.imagePreview.errors ? (
                  <p
                    role="alert"
                    className="text-sm font-semibold text-red-600"
                  >
                    {fields.imagePreview.errors}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center justify-end gap-2 pt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpenAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </fetcher.Form>
          </DialogContent>
        </Dialog>
      </div>
      <ul className="grid grid-cols-4 gap-4">
        {spaces.map((space) => (
          <li key={space.id}>
            <Link
              to={space.id.toString()}
              className="rounded-xl overflow-hidden border flex flex-col hover:-translate-y-1 transition hover:shadow-xl"
            >
              {space.imagePreview ? (
                <img
                  src={space.imagePreview}
                  alt={space.name}
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="bg-neutral-300 h-52 w-full"></div>
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-1">{space.name}</h2>
                <p className="text-muted-foreground">{space.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
