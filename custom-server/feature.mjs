import { prisma } from "../server.mjs";
import { randomPointInsidePolygon } from "./util.mjs";

export async function uploadDeviceLocation(client, { deviceCode, roomCode }) {
  const result = await prisma.$transaction(async (tx) => {
    const device = await tx.device.findUnique({
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

    if (device.currentLocation?.roomId === room.id) {
      // Skip the process if the room is still the same
      return device.currentLocation;
    }

    const polygons = room.corners.map((corner) => ({
      x: corner.x,
      y: corner.z,
    }));

    // Generate location
    const point = randomPointInsidePolygon(polygons);

    const currentLocation = await tx.deviceCurrentLocation.update({
      where: { deviceId: device.id },
      data: {
        spaceId: room.spaceId,
        roomId: room.id,
        levelIndex: 0,
        elevation: 1,
        x: point.x,
        z: point.y,
      },
    });

    // Publish to MQTT
    const payload = {
      id: device.id.toString(),
      deviceName: device.name,
      roomName: room.name,
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
