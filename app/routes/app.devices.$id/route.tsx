import { PutObjectCommand } from "@aws-sdk/client-s3";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { useState } from "react";
import ShortUniqueId from "short-unique-id";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import prisma from "~/lib/prisma.server";
import { s3Client } from "~/lib/s3.server";
import { redirectWithToast } from "~/utils/toast.server";

export const schema = z.discriminatedUnion("_intent", [
  z.object({
    _intent: z.literal("edit-device"),
    name: z.string(),
    code: z.string(),
    description: z.string(),
    color: z.string().optional(),
    image: z
      .instanceof(File, { message: "Image preview is required" })
      .optional(),
  }),
  z.object({
    _intent: z.literal("delete-device"),
  }),
]);

export async function action({ request, params }: ActionFunctionArgs) {
  const id = params.id;
  if (!id || !Number(id)) {
    return redirect("/app/devices");
  }

  const formData = await request.formData();

  const submission = parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return json(submission.reply());
  }

  if (submission.value._intent === "edit-device") {
    const { code, description, name, color, image } = submission.value;

    let url: string | undefined;

    if (image) {
      const uid = new ShortUniqueId({ length: 10 });
      const fileId = uid.randomUUID();
      const fileName = `devices/${fileId}.${image.name.split(".").slice(-1)}`;

      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: Buffer.from(await image.arrayBuffer()),
        ContentType: image.type,
        ACL: "public-read",
      });

      await s3Client.send(command);
      url = `${process.env.S3_END_POINT}/${process.env.S3_BUCKET_NAME}/${fileName}`;
    }

    try {
      await prisma.device.update({
        where: { id: Number(id) },
        data: { code, description, name, color, image: url },
      });

      return redirectWithToast(`/app/devices/${id}`, {
        description: "Device edited",
        type: "success",
      });
    } catch (error) {
      return redirectWithToast(`/app/devices/${id}`, {
        description: "Fail to edit device",
        type: "error",
      });
    }
  } else {
    try {
      await prisma.device.delete({
        where: { id: Number(id) },
      });

      return redirectWithToast(`/app/devices`, {
        description: "Device deleted",
        type: "success",
      });
    } catch (error) {
      return redirectWithToast(`/app/devices/${id}`, {
        description: "Fail to delete device",
        type: "error",
      });
    }
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id || !Number(id)) {
    return redirect("/app/devices");
  }

  const device = await prisma.device.findUnique({
    where: { id: Number(id) },
    include: {
      locationHistories: {
        include: { room: true, space: true },
        orderBy: { timestamp: "desc" },
      },
    },
  });

  if (!device) {
    return redirect("/app/devices");
  }

  return json({ device });
}

export default function EditDevice() {
  const lastResult = useActionData<typeof action>();
  const { device } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [form, fields] = useForm({
    lastResult,
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <>
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this
              device.
            </DialogDescription>
          </DialogHeader>

          <Form method="POST">
            <input type="hidden" name="_intent" value="delete-device" />

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setOpenDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" type="submit" disabled={submitting}>
                {submitting ? "Deleting" : "Delete"}
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
      <aside className="px-8 py-6 border-l w-[400px]">
        <h2 className="font-semibold text-lg mb-4">Edit Device</h2>
        <Tabs defaultValue="device-data" className="w-full flex-1 grid">
          <TabsList>
            <TabsTrigger value="device-data" className="w-1/2">
              Device Data
            </TabsTrigger>
            <TabsTrigger value="movement-histories" className="w-1/2">
              Movement Histories
            </TabsTrigger>
          </TabsList>
          <TabsContent value="device-data">
            <Form
              key={device.id}
              method="post"
              encType="multipart/form-data"
              id={form.id}
              onSubmit={form.onSubmit}
              className="space-y-4"
            >
              <input type="hidden" name="_intent" value="edit-device" />
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={device.name} />
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
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" defaultValue={device.code} />
                {fields.code.errors ? (
                  <p
                    role="alert"
                    className="text-sm font-semibold text-red-600"
                  >
                    {fields.code.errors}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={device.description}
                />
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
                <Label htmlFor="image">Image (URL)</Label>
                {device.image ? (
                  <img
                    src={device.image}
                    alt="device"
                    className="rounded-lg h-24 object-contain w-full border"
                  />
                ) : null}
                <Input id="image" name="image" type="file" />
                {fields.image.errors ? (
                  <p
                    role="alert"
                    className="text-sm font-semibold text-red-600"
                  >
                    {fields.image.errors}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/app/devices")}
                >
                  Close
                </Button>
                <Button disabled={submitting}>Save</Button>
              </div>
            </Form>
            <Separator className="my-4" />
            <div>
              <h3 className="text-sm font-semibold mb-2">Danger Zone</h3>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setOpenDeleteModal(true)}
              >
                Delete Device
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="movement-histories">
            {device.locationHistories.length === 0 && (
              <div className="flex items-center justify-center h-20 border rounded-lg border-dashed">
                <p className="text-muted-foreground text-sm">No history</p>
              </div>
            )}
            <ul className="space-y-2">
              {device.locationHistories.map((history) => (
                <li key={history.id} className="border rounded-lg px-3 py-1">
                  <p className="text-sm text-muted-foreground">
                    {new Date(history.timestamp).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "medium",
                    })}
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    {history.space.name}
                  </p>
                  <p className="flex items-center gap-1 font-semibold text-sm -ml-0.5 mt-0.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ background: history.room.color }}
                    ></span>
                    {history.room.name}
                  </p>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </aside>
    </>
  );
}
