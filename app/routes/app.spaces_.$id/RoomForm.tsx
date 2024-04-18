import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Room } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { Form, useNavigation } from "@remix-run/react";
import { Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label, labelVariants } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { Corner } from "~/services/room.server";

export const schema = z.object({
  _intent: z.literal("edit-room"),
  roomId: z.number(),
  name: z.string(),
  color: z.string(),
  code: z.string(),
  corners: z.array(
    z.object({
      x: z.number(),
      z: z.number(),
    })
  ),
});

type Props = {
  room: SerializeFrom<Room>;
};

export default function RoomForm({ room }: Props) {
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle";
  const [form, fields] = useForm({
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    defaultValue: {
      code: room.code,
      color: room.color,
      name: room.name,
      corners: room.corners as Corner[],
    },
  });
  const corners = fields.corners.getFieldList();

  return (
    <Form
      method="POST"
      className="pr-2 pl-6 space-y-2 py-2"
      id={form.id}
      onSubmit={form.onSubmit}
    >
      <input type="hidden" name="_intent" value="edit-room" />
      <input type="hidden" name="roomId" value={room.id} />
      <div className="grid gap-1">
        <Label htmlFor="name" className="text-xs">
          Room Name
        </Label>
        <Input
          id="name"
          name="name"
          className="h-[30px] px-2 focus-visible:ring-0"
          defaultValue={fields.name.initialValue}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="grid gap-1">
          <Label htmlFor="code" className="text-xs">
            Room Code
          </Label>
          <Input
            id="code"
            name="code"
            className="h-[30px] px-2 focus-visible:ring-0"
            defaultValue={fields.code.initialValue || ""}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="color" className="text-xs">
            Color
          </Label>
          <Input
            id="color"
            name="color"
            className="h-[30px] p-1 w-12 focus-visible:ring-0"
            type="color"
            defaultValue={fields.color.initialValue}
          />
        </div>
      </div>
      <fieldset className="border rounded-lg">
        <legend className={cn(labelVariants(), "mb-2 text-xs")}>Corners</legend>
        <div className="p-2 space-y-2">
          {corners.map((corner, index) => {
            const cornerFields = corner.getFieldset();

            return (
              <div key={corner.key} className="flex gap-2 items-end">
                <div className="grid grid-cols-2 gap-2 items-end flex-1">
                  <div className="grid gap-1">
                    <Label
                      className={cn(
                        "text-xs text-center mb-1",
                        index !== 0 && "sr-only"
                      )}
                    >
                      X
                    </Label>
                    <Input
                      type="number"
                      className="h-[30px]"
                      name={cornerFields.x.name}
                      defaultValue={cornerFields.x.initialValue}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label
                      className={cn(
                        "text-xs text-center mb-1",
                        index !== 0 && "sr-only"
                      )}
                    >
                      Z
                    </Label>
                    <Input
                      type="number"
                      className="h-[30px]"
                      name={cornerFields.z.name}
                      defaultValue={cornerFields.z.initialValue}
                    />
                  </div>
                </div>
                <button
                  className="h-[30px] w-[30px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg"
                  onClick={() =>
                    form.remove({ index, name: fields.corners.name })
                  }
                >
                  <span className="sr-only">Delete corner</span>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </fieldset>
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
