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
import { schema as roomSchema } from "./RoomForm";
import { createRoom, deleteRoom, editRoom } from "~/services/room.server";
import { schema as spaceSchema } from "./SpaceForm";
import { deleteSpace, editSpace } from "~/services/space.server";
import { useEffect, useState } from "react";
import useMqtt, { type LocationChangedPayload } from "~/hooks/useMqtt";
import toast from "react-hot-toast";
import ShortUniqueId from "short-unique-id";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "~/lib/s3.server";
// import { checkIsValidPolygon } from "~/utils/polygon";

const validIntents = [
  "create-room",
  "edit-room",
  "delete-room",
  "edit-space",
  "delete-space",
];

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

  if (intent === "create-room") {
    const submission = parseWithZod(formData, { schema: roomSchema });

    if (submission.status !== "success") {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to create room",
        intent,
      });
    }

    if (submission.value._intent !== "create-room") {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to create room. Invalid intent",
        intent,
      });
    }

    const { code, color, corners, name } = submission.value;

    try {
      const room = await createRoom({
        spaceId: Number(id),
        code,
        color,
        corners,
        name,
      });
      return json({
        success: true,
        lastResult: null,
        data: {
          room,
        },
        timestamp: new Date(),
        message: `New room created`,
        intent,
      });
    } catch (error) {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: `Failed to create room`,
        intent,
      });
    }
  } else if (intent === "edit-room") {
    const submission = parseWithZod(formData, { schema: roomSchema });

    if (submission.status !== "success") {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to edit room",
        intent,
      });
    }

    if (submission.value._intent !== "edit-room") {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to edit room. Invalid intent",
        intent,
      });
    }

    const { code, color, corners, name, roomId } = submission.value;

    // const { valid, invalidCause } = checkIsValidPolygon(
    //   corners.map((c) => ({ x: c.x, y: c.z }))
    // );

    // console.log({ valid, invalidCause });

    // if (!valid) {
    //   if (submission.value._intent !== "edit-room") {
    //     return json({
    //       success: false,
    //       lastResult: submission.reply({ formErrors: [invalidCause] }),
    //       data: null,
    //       timestamp: new Date(),
    //       message: "Failed to edit room. Invalid intent",
    //       intent,
    //     });
    //   }
    // }

    try {
      const room = await editRoom({ id: roomId, code, color, corners, name });

      return json({
        success: true,
        lastResult: null,
        data: {
          room,
        },
        timestamp: new Date(),
        message: `Room ${room.name} edited`,
        intent,
      });
    } catch (error) {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to edit room",
        intent,
      });
    }
  } else if (intent === "delete-room") {
    const submission = parseWithZod(formData, { schema: roomSchema });

    if (submission.status !== "success") {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to delete room",
        intent,
      });
    }

    if (submission.value._intent !== "delete-room") {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to delete room. Invalid intent",
        intent,
      });
    }

    const { roomId } = submission.value;

    try {
      const room = await deleteRoom({ id: roomId });

      return json({
        success: true,
        lastResult: submission.reply(),
        data: {
          room,
        },
        timestamp: new Date(),
        message: `Room ${room.name} deleted`,
        intent,
      });
    } catch (error) {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to delete room",
        intent,
      });
    }
  } else if (intent === "edit-space") {
    const submission = parseWithZod(formData, { schema: spaceSchema });

    if (submission.status !== "success") {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to edit space",
        intent,
      });
    }

    if (submission.value._intent !== "edit-space") {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to edit space. Invalid intent",
        intent,
      });
    }

    const { description, name, spaceId, imagePreview, smplrSpaceId } =
      submission.value;

    const uid = new ShortUniqueId({ length: 10 });
    const fileId = uid.randomUUID();
    const fileName = `spaces/${fileId}.${imagePreview.name
      .split(".")
      .slice(-1)}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: Buffer.from(await imagePreview.arrayBuffer()),
      ContentType: imagePreview.type,
      ACL: "public-read",
    });

    await s3Client.send(command);

    const url = `${process.env.S3_END_POINT}/${process.env.S3_BUCKET_NAME}/${fileName}`;

    try {
      const space = await editSpace({
        id: spaceId,
        name,
        description,
        smplrSpaceId,
        imagePreview: url,
      });

      return json({
        success: true,
        lastResult: submission.reply(),
        data: { space },
        timestamp: new Date(),
        message: "Space edited!",
        intent,
      });
    } catch (error) {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to edit space",
        intent,
      });
    }
  } else if (intent === "delete-space") {
    const submission = parseWithZod(formData, { schema: spaceSchema });

    if (submission.status !== "success") {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to delete space",
        intent,
      });
    }

    if (submission.value._intent !== "delete-space") {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to delete space. Invalid intent",
        intent,
      });
    }

    const { spaceId } = submission.value;

    try {
      const space = await deleteSpace({
        id: spaceId,
      });

      return json({
        success: true,
        lastResult: submission.reply(),
        data: { space },
        timestamp: new Date(),
        message: "Space deleted!",
        intent,
      });
    } catch (error) {
      return json({
        success: false,
        lastResult: submission.reply(),
        data: null,
        timestamp: new Date(),
        message: "Failed to delete space",
        intent,
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

  const mqttConfig = {
    url: process.env.VITE_MQTT_URL || "",
    username: process.env.VITE_MQTT_USERNAME || "",
    password: process.env.VITE_MQTT_PASSWORD || "",
    port: process.env.VITE_MQTT_PORT ? +process.env.VITE_MQTT_PORT : 0,
  };

  return json({ space, cornersData, deviceLocationsData, mqttConfig });
}

export default function Space() {
  const {
    space,
    cornersData,
    deviceLocationsData: _deviceLocationsData,
    mqttConfig,
  } = useLoaderData<typeof loader>();
  const [deviceLocationsData, setDeviceLocationsData] =
    useState(_deviceLocationsData);
  const { isConnected, mqttSubscribe, payload } = useMqtt({ ...mqttConfig });

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
