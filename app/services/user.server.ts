import prisma from "~/lib/prisma.server";

export async function getUserById({ id }: { id: number }) {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    return null;
  }
  const { password, ...userData } = user;
  return { ...userData, hasPassword: !!password };
}
