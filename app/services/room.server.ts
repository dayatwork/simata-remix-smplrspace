import prisma from "~/lib/prisma.server";

export type Corner = { x: number; z: number };

type EditRoomProps = {
  id: number;
  name?: string;
  code?: string;
  color?: string;
  corners?: Corner[];
};

export async function editRoom({
  id,
  code,
  color,
  corners,
  name,
}: EditRoomProps) {
  const room = await prisma.room.update({
    where: { id },
    data: { code, color, name, corners },
  });
  return room;
}
