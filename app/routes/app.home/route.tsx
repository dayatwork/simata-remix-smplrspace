import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import prisma from "~/lib/prisma.server";

export async function loader() {
  const [totalSpaces, totalRooms, totalDevices] = await prisma.$transaction([
    prisma.space.count(),
    prisma.room.count(),
    prisma.device.count(),
  ]);

  return json({ totalSpaces, totalRooms, totalDevices });
}

export default function Home() {
  const { totalDevices, totalRooms, totalSpaces } =
    useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto w-full py-10 px-8">
      <h1 className="sr-only">Home</h1>
      <div className="grid grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg bg-accent">
          <h3 className="font-semibold text-lg">Spaces</h3>
          <p className="text-5xl font-bold">{totalSpaces}</p>
        </div>
        <div className="p-6 border rounded-lg bg-accent">
          <h3 className="font-semibold text-lg">Rooms</h3>
          <p className="text-5xl font-bold">{totalRooms}</p>
        </div>
        <div className="p-6 border rounded-lg bg-accent">
          <h3 className="font-semibold text-lg">Devices</h3>
          <p className="text-5xl font-bold">{totalDevices}</p>
        </div>
      </div>
    </div>
  );
}
