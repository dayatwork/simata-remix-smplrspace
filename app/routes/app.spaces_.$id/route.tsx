import { json, useLoaderData } from "@remix-run/react";
import SpaceViewer, {
  CornerData,
  LocationData,
} from "~/components/SpaceViewer";
import RightSidebar from "./RightSidebar";
import prisma from "~/lib/prisma.server";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { parseWithZod } from "@conform-to/zod";
import { schema as editRoomSchema } from "./RoomForm";
import { editRoom } from "~/services/room.server";
import { schema as editSpaceSchema } from "./SpaceForm";
import { editSpace } from "~/services/space.server";
import { redirectWithToast } from "~/utils/toast.server";
import { useEffect, useState } from "react";
import useMqtt, { type LocationChangedPayload } from "~/hooks/useMqtt";
import toast from "react-hot-toast";

const validIntents = ["reset", "edit-room", "edit-space"];

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
  } else if (intent === "edit-room") {
    const submission = parseWithZod(formData, { schema: editRoomSchema });

    if (submission.status !== "success") {
      // return json({ error: "Failed to edit room" });
      return redirectWithToast(`/app/spaces/${id}`, {
        description: `Failed to edit room. ${submission.error}`,
        type: "error",
      });
    }

    const { code, color, corners, name, roomId } = submission.value;
    try {
      const room = await editRoom({ id: roomId, code, color, corners, name });
      // return json({ room, error: "" });
      return redirectWithToast(`/app/spaces/${id}`, {
        description: `Room ${room.name} edited`,
        type: "success",
      });
    } catch (error) {
      // return json({ error: "Failed to edit room" });
      return redirectWithToast(`/app/spaces/${id}`, {
        description: `Failed to edit room. ${error}`,
        type: "error",
      });
    }
  } else if (intent === "edit-space") {
    const submission = parseWithZod(formData, { schema: editSpaceSchema });

    if (submission.status !== "success") {
      return redirectWithToast(`/app/spaces/${id}`, {
        description: `Failed to edit space`,
        type: "error",
      });
      // return json({ error: "Failed to edit space" });
    }

    const { description, name, spaceId, imagePreview, smplrSpaceId } =
      submission.value;
    try {
      await editSpace({
        id: spaceId,
        name,
        description,
        smplrSpaceId,
        imagePreview,
      });
      // return json({ room, error: "" });
      return redirectWithToast(`/app/spaces/${spaceId}`, {
        description: `Space edited`,
        type: "success",
      });
    } catch (error) {
      // return json({ error: "Failed to edit room" });
      return redirectWithToast(`/app/spaces/${spaceId}`, {
        description: `Failed to edit space`,
        type: "error",
      });
    }
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
    include: {
      rooms: { orderBy: { id: "asc" } },
      deviceCurrentLocations: { include: { device: true, room: true } },
    },
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

  const deviceLocationsData: LocationData[] = space.deviceCurrentLocations.map(
    (dcl) => ({
      id: dcl.deviceId.toString(),
      color: dcl.device.color,
      name: dcl.device.name,
      image: dcl.device.image || "https://placehold.co/400",
      code: dcl.device.code,
      roomName: dcl.room.name,
      roomCode: dcl.room.code,
      roomColor: dcl.room.color,
      timestamp: dcl.timestamp.toISOString(),
      position: {
        elevation: dcl.elevation,
        levelIndex: dcl.levelIndex,
        x: dcl.x,
        z: dcl.z,
      },
    })
  );

  return json({ space, cornersData, deviceLocationsData });
}

export default function Space() {
  const {
    space,
    cornersData,
    deviceLocationsData: _deviceLocationsData,
  } = useLoaderData<typeof loader>();
  const [deviceLocationsData, setDeviceLocationsData] =
    useState(_deviceLocationsData);
  const { isConnected, mqttSubscribe, payload } = useMqtt();

  useEffect(() => {
    if (isConnected) {
      mqttSubscribe("location-changed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  useEffect(() => {
    if (payload.message && payload.topic === "location-changed") {
      const {
        color,
        id,
        image,
        name,
        position,
        roomName,
        code,
        roomCode,
        roomColor,
        timestamp,
      } = JSON.parse(payload.message) as LocationChangedPayload;

      setDeviceLocationsData((prev) => {
        const notEditedData = prev.filter((data) => data.id !== id);
        const editedData = {
          id,
          color,
          image,
          name,
          position,
          code,
          roomName,
          roomCode,
          roomColor,
          timestamp,
        };
        return [...notEditedData, editedData];
      });

      toast(`${name} move to ${roomName}`, {
        position: "bottom-center",
        icon: "🚀",
      });
    }
  }, [payload]);

  return (
    <div className="flex-1 flex">
      {space.smplrSpaceId ? (
        <SpaceViewer
          cornersData={cornersData}
          deviceLocationsData={deviceLocationsData}
          smplrSpaceId={space.smplrSpaceId}
          spaceName={space.name}
          spaceDescription={space.description}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p>No smplrspace</p>
        </div>
      )}
      <RightSidebar
        cornersData={cornersData}
        deviceLocationData={deviceLocationsData}
        rooms={space.rooms}
        space={space}
        // devicesCurrentLocation={deviceLocationsData}
      />
    </div>
  );
}
