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
import { useEffect, useState } from "react";
// import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

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
  z.object({
    _intent: z.literal("delete-room"),
    roomId: z.number(),
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
type DeleteRoomProps = {
  room: SerializeFrom<Room>;
  intent: "delete-room";
};

type Props = EditRoomProps | CreateRoomProps | DeleteRoomProps;

export default function RoomForm(props: Props) {
  const fetcher = useFetcher<typeof spaceAction>({ key: props.intent });
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  // const navigation = useNavigation();
  // const submitting = navigation.state !== "idle";
  const submitting = fetcher.state === "submitting";
  const fetcherData = fetcher.data;

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
  const reset = form.reset;

  useEffect(() => {
    if (fetcherData?.success) {
      // toast.success(fetcherData.message);

      setOpenDeleteModal(false);
    }
  }, [fetcherData, form]);

  useEffect(() => {
    if (props.intent === "create-room" && fetcherData?.success) {
      reset();
    }
  }, [reset, props.intent, fetcherData?.success]);

  // console.log({ name: fields.name.initialValue });
  // console.log({ code: fields.code.initialValue });

  return (
    <>
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              room.
            </DialogDescription>
          </DialogHeader>

          <fetcher.Form method="POST">
            <input type="hidden" name="_intent" value="delete-room" />
            {selectedRoomId ? (
              <input type="hidden" name="roomId" value={selectedRoomId} />
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setOpenDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                type="submit"
                disabled={!selectedRoomId || submitting}
              >
                {submitting ? "Deleting" : "Delete"}
              </Button>
            </div>
          </fetcher.Form>
        </DialogContent>
      </Dialog>
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
            defaultValue={fields.name.initialValue || ""}
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
              defaultValue={fields.color.initialValue || "#000000"}
            />
          </div>
        </div>
        <fieldset className="border rounded-lg">
          <legend className={cn(labelVariants(), "mb-2 text-xs")}>
            Corners
          </legend>
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
        <div className="flex justify-between  pt-2">
          {props.intent === "edit-room" ? (
            <Button
              type="button"
              className="h-[30px]"
              variant="destructive"
              onClick={() => {
                setOpenDeleteModal(true);
                setSelectedRoomId(props.room.id);
              }}
            >
              Delete Room
            </Button>
          ) : (
            <div />
          )}
          <div className="flex justify-end gap-2">
            {props.intent === "create-room" && (
              <Button
                variant="ghost"
                className="h-[30px]"
                onClick={props.onCancel}
              >
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
        </div>
      </fetcher.Form>
    </>
  );
}
