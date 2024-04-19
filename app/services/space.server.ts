import prisma from "~/lib/prisma.server";

type EditSpaceProps = {
  id: number;
  name?: string;
  description?: string;
  smplrSpaceId?: string;
  imagePreview?: string;
};

export async function editSpace({
  id,
  name,
  description,
  imagePreview,
  smplrSpaceId,
}: EditSpaceProps) {
  const space = await prisma.space.update({
    where: { id },
    data: { description, imagePreview, name, smplrSpaceId },
  });
  return space;
}
