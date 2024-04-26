import prisma from "~/lib/prisma.server";

export type Corner = { x: number; z: number };

type CreateRoomProps = {
  spaceId: number;
  name: string;
  code: string;
  color: string;
  corners: Corner[];
};

export async function createRoom({
  spaceId,
  code,
  color,
  corners,
  name,
}: CreateRoomProps) {
  const room = await prisma.room.create({
    data: { spaceId, code, color, name, corners },
  });
  return room;
}

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

export async function deleteRoom({ id }: { id: number }) {
  const room = await prisma.room.delete({ where: { id } });
  return room;
}
