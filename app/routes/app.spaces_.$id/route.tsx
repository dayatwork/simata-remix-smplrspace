import { json, useLoaderData } from "@remix-run/react";
import SpaceViewer, { CornerData } from "~/components/SpaceViewer";
import RightSidebar from "./RightSidebar";
import prisma from "~/lib/prisma.server";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";

const validIntents = ["reset"];

export async function action({ request, params }: ActionFunctionArgs) {
  const id = params.id;
  if (!id || !Number(id)) {
    return redirect("/app/spaces");
  }

  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (typeof intent !== "string" || !validIntents.includes(intent)) {
    throw new Response("Invalid intent", { status: 403 });
  }

  if (intent === "reset") {
    const roomData: Record<
      string,
      { name: string; code: string; corners: { x: number; z: number }[] }
    > = {
      "1": {
        name: "Room A",
        code: "ROOM-A",
        corners: [
          { x: -1, z: -8 },
          { x: 6, z: -8 },
          { x: 6, z: -13 },
          { x: -1, z: -13 },
        ],
      },
      "2": {
        name: "Room B",
        code: "ROOM-B",
        corners: [
          { x: 6, z: -8 },
          { x: 13, z: -8 },
          { x: 13, z: -13 },
          { x: 6, z: -13 },
        ],
      },
      "3": {
        name: "Room C",
        code: "ROOM-C",
        corners: [
          { x: -1, z: 0 },
          { x: 6, z: 0 },
          { x: 6, z: -5 },
          { x: -1, z: -5 },
        ],
      },
      "4": {
        name: "Room D",
        code: "ROOM-D",
        corners: [
          { x: 6, z: 0 },
          { x: 13, z: 0 },
          { x: 13, z: -5 },
          { x: 6, z: -5 },
        ],
      },
    };
    const rooms = await prisma.$transaction(
      Object.keys(roomData).map((key) =>
        prisma.room.upsert({
          where: { code: roomData[key].code },
          create: {
            code: roomData[key].code,
            name: roomData[key].name,
            corners: roomData[key].corners,
            spaceId: Number(id),
          },
          update: { corners: roomData[key].corners },
        })
      )
    );
    return rooms;
  } else {
    throw new Response("Invalid intent", { status: 403 });
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id || !Number(id)) {
    return redirect("/app/spaces");
  }

  const space = await prisma.space.findUnique({
    where: { id: Number(id) },
    include: { rooms: true },
  });
  if (!space) {
    return redirect("/app/spaces");
  }

  const cornersData: CornerData[] = space.rooms.map((room) => {
    const roomCorners = room.corners as { x: number; z: number }[];
    return {
      id: `${room.id}`,
      name: room.name,
      color: room.color,
      coordinates: roomCorners.map((corner) => ({
        levelIndex: 0,
        x: corner.x,
        z: corner.z,
      })),
    };
  });

  // space.rooms.forEach((room) => {
  //   const roomCorners = room.corners as { x: number; z: number }[];
  //   roomCorners.forEach((point, index) => {
  //     cornersData.push({
  //       id: `${room.name}.${index}`,
  //       name: `${room.name} ${index}`,
  //       position: { elevation: 1, levelIndex: 0, x: point.x, z: point.z },
  //     });
  //   });
  // });

  return json({ space, cornersData });
}

export default function Space() {
  const { space, cornersData } = useLoaderData<typeof loader>();
  console.log({ space });

  return (
    <div className="flex-1 flex">
      {/* {space.smplrSpaceId ? (
        <SpaceViewer
          cornersData={cornersData}
          deviceLocationData={[]}
          spaceId={space.smplrSpaceId}
        />
      ) : ( */}
      <div className="flex flex-1 items-center justify-center">
        <p>No smplrspace</p>
      </div>
      {/* )} */}
      <RightSidebar
        cornersData={cornersData}
        deviceLocationData={[]}
        rooms={space.rooms}
      />
    </div>
  );
}
