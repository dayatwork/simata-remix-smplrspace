import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { ActionFunctionArgs, json } from "@remix-run/node";
import {
  Form,
  useActionData,
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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const submission = parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return json(submission.reply());
  }

  const { code, description, name, color, image } = submission.value;

  try {
    await prisma.device.create({
      data: { code, description, name, color, image },
    });

    return redirectWithToast("/app/devices", {
      description: "New device registered",
      type: "success",
    });
  } catch (error) {
    return redirectWithToast("/app/devices", {
      description: "Fail to register new device",
      type: "error",
    });
  }
}

export default function RegisterDevice() {
  const lastResult = useActionData<typeof action>();
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
      <h2 className="font-semibold text-lg mb-4">Register New Device</h2>
      <Form
        method="post"
        id={form.id}
        onSubmit={form.onSubmit}
        className="space-y-4"
      >
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={fields.name.initialValue}
          />
          {fields.name.errors ? (
            <p role="alert" className="text-sm font-semibold text-red-600">
              {fields.name.errors}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            name="code"
            defaultValue={fields.code.initialValue}
          />
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
            defaultValue={fields.description.initialValue}
          />
          {fields.description.errors ? (
            <p role="alert" className="text-sm font-semibold text-red-600">
              {fields.description.errors}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="image">Image (URL)</Label>
          <Input
            id="image"
            name="image"
            defaultValue={fields.image.initialValue}
          />
          {fields.image.errors ? (
            <p role="alert" className="text-sm font-semibold text-red-600">
              {fields.image.errors}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" onClick={() => navigate("/app/devices")}>
            Cancel
          </Button>
          <Button disabled={submitting}>Submit</Button>
        </div>
      </Form>
    </aside>
  );
}
