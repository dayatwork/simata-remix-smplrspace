import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Space } from "@prisma/client";
import { Form, useNavigation } from "@remix-run/react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export const schema = z.object({
  _intent: z.literal("edit-space"),
  spaceId: z.number(),
  name: z.string(),
  description: z.string(),
  smplrSpaceId: z.string().optional(),
  imagePreview: z.string().url().optional(),
});

type Props = {
  space: Space;
};

export default function SpaceForm({ space }: Props) {
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle";
  const [form, fields] = useForm({
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    defaultValue: {
      name: space.name,
      description: space.description,
      imagePreview: space.imagePreview,
      smplrSpaceId: space.smplrSpaceId,
    },
  });

  return (
    <Form
      method="POST"
      className="px-2 space-y-2 py-2"
      id={form.id}
      onSubmit={form.onSubmit}
    >
      <input type="hidden" name="_intent" value="edit-space" />
      <input type="hidden" name="spaceId" value={space.id} />
      <div className="grid gap-1">
        <Label htmlFor="name" className="text-xs">
          Space Name
        </Label>
        <Input
          id="name"
          name="name"
          className="h-[30px] px-2 focus-visible:ring-0"
          defaultValue={fields.name.initialValue}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="description" className="text-xs">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          className="px-2 focus-visible:ring-0"
          defaultValue={fields.description.initialValue || ""}
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="smplrSpaceId" className="text-xs">
          SmplrSpaceId
        </Label>
        <Input
          id="smplrSpaceId"
          name="smplrSpaceId"
          className="h-[30px] px-2 focus-visible:ring-0"
          defaultValue={fields.smplrSpaceId.initialValue}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="imagePreview" className="text-xs">
          Image Preview (URL)
        </Label>
        <Input
          id="imagePreview"
          name="imagePreview"
          className="h-[30px] px-2 focus-visible:ring-0"
          defaultValue={fields.imagePreview.initialValue}
        />
      </div>
      <div className="flex pt-2">
        <Button
          size="sm"
          className="h-[30px]"
          disabled={!form.dirty || submitting}
        >
          Save
        </Button>
      </div>
    </Form>
  );
}
