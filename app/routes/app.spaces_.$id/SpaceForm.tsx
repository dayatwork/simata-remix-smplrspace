import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { Space } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { action as spaceAction } from "./route";
import { useState } from "react";
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
    _intent: z.literal("edit-space"),
    spaceId: z.number(),
    name: z.string(),
    description: z.string(),
    smplrSpaceId: z.string().optional(),
    imagePreview: z.instanceof(File, { message: "Image preview is required" }),
  }),
  z.object({
    _intent: z.literal("delete-space"),
    spaceId: z.number(),
  }),
]);

type Props = {
  space: Space;
};

export default function SpaceForm({ space }: Props) {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const fetcher = useFetcher<typeof spaceAction>({ key: "edit-space" });
  const submitting = fetcher.state !== "idle";
  // const fetcherData = fetcher.data;
  const deleteFetcher = useFetcher<typeof spaceAction>({ key: "delete-space" });
  const deleting = deleteFetcher.state !== "idle";
  // const deleteFetcherData = deleteFetcher.data;

  // useEffect(() => {
  //   if (fetcherData?.success) {
  //     toast.success(fetcherData.message);
  //   }
  // }, [fetcherData?.success, fetcherData?.message]);

  // useEffect(() => {
  //   if (deleteFetcherData?.success) {
  //     toast.success(deleteFetcherData.message);
  //   }
  // }, [deleteFetcherData?.success, deleteFetcherData?.message]);

  const [form, fields] = useForm({
    lastResult: fetcher.data?.lastResult,
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    defaultValue: {
      name: space.name,
      description: space.description,
      smplrSpaceId: space.smplrSpaceId,
    },
  });

  return (
    <>
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Space</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              space.
            </DialogDescription>
          </DialogHeader>

          <deleteFetcher.Form method="POST">
            <input type="hidden" name="_intent" value="delete-space" />
            <input type="hidden" name="spaceId" value={space.id} />

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setOpenDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" type="submit" disabled={deleting}>
                {deleting ? "Deleting" : "Delete"}
              </Button>
            </div>
          </deleteFetcher.Form>
        </DialogContent>
      </Dialog>
      <fetcher.Form
        method="POST"
        encType="multipart/form-data"
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
          {space.imagePreview ? (
            <img
              src={space.imagePreview}
              alt="preview"
              className="rounded-lg"
            />
          ) : null}
          <Input
            id="imagePreview"
            name="imagePreview"
            className="px-2 focus-visible:ring-0 flex"
            type="file"
          />
        </div>
        <div className="flex justify-between pt-2">
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-[30px]"
            disabled={submitting}
            onClick={() => {
              setOpenDeleteModal(true);
            }}
          >
            Delete
          </Button>
          <Button
            size="sm"
            className="h-[30px]"
            disabled={!form.dirty || submitting}
          >
            Save
          </Button>
        </div>
      </fetcher.Form>
    </>
  );
}
