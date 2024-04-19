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
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import prisma from "~/lib/prisma.server";
import { redirectWithToast } from "~/utils/toast.server";

export const schema = z.object({
  name: z.string(),
  code: z.string(),
  description: z.string(),
  color: z.string().optional(),
  image: z.string().url().optional(),
});

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

  const { code, description, name, color, image } = submission.value;

  try {
    await prisma.device.update({
      where: { id: Number(id) },
      data: { code, description, name, color, image },
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
}

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id || !Number(id)) {
    return redirect("/app/devices");
  }

  const device = await prisma.device.findUnique({ where: { id: Number(id) } });

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

  const [form, fields] = useForm({
    lastResult,
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <aside className="px-8 py-6 border-l w-[400px]">
      <h2 className="font-semibold text-lg mb-4">Edit Device</h2>
      <Form
        key={device.id}
        method="post"
        id={form.id}
        onSubmit={form.onSubmit}
        className="space-y-4"
      >
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={device.name} />
          {fields.name.errors ? (
            <p role="alert" className="text-sm font-semibold text-red-600">
              {fields.name.errors}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" defaultValue={device.code} />
          {fields.code.errors ? (
            <p role="alert" className="text-sm font-semibold text-red-600">
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
            <p role="alert" className="text-sm font-semibold text-red-600">
              {fields.description.errors}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="image">Image (URL)</Label>
          <Input id="image" name="image" defaultValue={device.image || ""} />
          {fields.image.errors ? (
            <p role="alert" className="text-sm font-semibold text-red-600">
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
    </aside>
  );
}
