import { prisma } from "../server.mjs";
import { randomPointInsidePolygon } from "./util.mjs";

export async function uploadDeviceLocation(client, { deviceCode, roomCode }) {
  const result = await prisma.$transaction(async (tx) => {
    const device = await tx.device.findFirst({
      where: { code: deviceCode },
      include: { currentLocation: true },
    });
    const room = await tx.room.findUnique({ where: { code: roomCode } });

    if (!device) {
      throw new Error("Device not found");
    }

    if (!room) {
      throw new Error("Room not found");
    }

    if (device.currentLocation && device.currentLocation.roomId === room.id) {
      // Skip the process if the room is still the same
      return device.currentLocation;
    }

    const polygons = room.corners.map((corner) => ({
      x: corner.x,
      y: corner.z,
    }));

    // Generate location
    const point = randomPointInsidePolygon(polygons);

    const currentLocation = await tx.deviceCurrentLocation.upsert({
      where: { deviceId: device.id },
      create: {
        deviceId: device.id,
        spaceId: room.spaceId,
        roomId: room.id,
        levelIndex: 0,
        elevation: 1,
        x: point.x,
        z: point.y,
        timestamp: new Date(),
      },
      update: {
        spaceId: room.spaceId,
        roomId: room.id,
        levelIndex: 0,
        elevation: 1,
        x: point.x,
        z: point.y,
        timestamp: new Date(),
      },
    });

    await tx.deviceLocationHistory.create({
      data: {
        deviceId: currentLocation.deviceId,
        roomId: currentLocation.roomId,
        spaceId: currentLocation.spaceId,
        timestamp: currentLocation.timestamp,
      },
    });

    // Publish to MQTT
    const payload = {
      id: device.id.toString(),
      name: device.name,
      code: device.code,
      color: device.color,
      image: device.image,
      roomName: room.name,
      roomColor: room.color,
      roomCode: room.code,
      timestamp: currentLocation.timestamp,
      position: {
        levelIndex: currentLocation.levelIndex,
        elevation: currentLocation.elevation,
        x: currentLocation.x,
        z: currentLocation.z,
      },
    };
    client.publish("location-changed", JSON.stringify(payload));

    return currentLocation;
  });

  return result;
}
