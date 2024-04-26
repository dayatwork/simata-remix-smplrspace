import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Room } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { PlusIcon, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label, labelVariants } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { Corner } from "~/services/room.server";
import { action as spaceAction } from "./route";
import { useEffect } from "react";
import toast from "react-hot-toast";

export const schema = z.discriminatedUnion("_intent", [
  z.object({
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
  }),
  z.object({
    _intent: z.literal("create-room"),
    name: z.string(),
    color: z.string(),
    code: z.string(),
    corners: z.array(
      z.object({
        x: z.number(),
        z: z.number(),
      })
    ),
  }),
]);

type EditRoomProps = {
  room: SerializeFrom<Room>;
  intent: "edit-room";
};
type CreateRoomProps = {
  intent: "create-room";
  onCancel: () => void;
};

type Props = EditRoomProps | CreateRoomProps;

export default function RoomForm(props: Props) {
  const fetcher = useFetcher<typeof spaceAction>({ key: props.intent });

  // const navigation = useNavigation();
  // const submitting = navigation.state !== "idle";
  const submitting = fetcher.state === "submitting";
  const fetcherData = fetcher.data;

  useEffect(() => {
    if (fetcherData?.success) {
      toast.success(fetcherData.message);
    }
  }, [fetcherData]);

  const [form, fields] = useForm({
    lastResult: fetcherData?.lastResult,
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    defaultValue:
      props.intent === "edit-room"
        ? {
            code: props.room.code,
            color: props.room.color,
            name: props.room.name,
            corners: props.room.corners as Corner[],
          }
        : undefined,
  });
  const corners = fields.corners.getFieldList();

  return (
    <fetcher.Form
      method="POST"
      className={cn("pr-2 pl-6 space-y-2 py-2")}
      id={form.id}
      onSubmit={form.onSubmit}
    >
      {props.intent === "edit-room" && (
        <>
          <input type="hidden" name="_intent" value={props.intent} />
          <input type="hidden" name="roomId" value={props.room.id} />
        </>
      )}
      {props.intent === "create-room" && (
        <input type="hidden" name="_intent" value={props.intent} />
      )}
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
                      className="h-[30px] focus-visible:ring-0"
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
                      className="h-[30px] focus-visible:ring-0"
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
          <button
            className="text-xs font-semibold border px-3 py-1 rounded-md inline-flex items-center hover:bg-accent"
            onClick={() => form.insert({ name: fields.corners.name })}
          >
            <PlusIcon className="w-3 h-3 mr-1" />
            Add Corner
          </button>
        </div>
      </fieldset>
      <div className="flex justify-end gap-2 pt-2">
        {props.intent === "create-room" && (
          <Button variant="ghost" className="h-[30px]" onClick={props.onCancel}>
            Cancel
          </Button>
        )}
        <Button
          size="sm"
          className={cn(
            "h-[30px]",
            props.intent === "create-room" && "bg-green-600"
          )}
          disabled={!form.dirty || submitting}
        >
          {props.intent === "create-room" ? "Create" : "Save"}
        </Button>
      </div>
    </fetcher.Form>
  );
}
