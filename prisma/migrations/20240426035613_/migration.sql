-- DropForeignKey
ALTER TABLE "DeviceCurrentLocation" DROP CONSTRAINT "DeviceCurrentLocation_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceCurrentLocation" DROP CONSTRAINT "DeviceCurrentLocation_roomId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceCurrentLocation" DROP CONSTRAINT "DeviceCurrentLocation_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceLocationHistory" DROP CONSTRAINT "DeviceLocationHistory_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceLocationHistory" DROP CONSTRAINT "DeviceLocationHistory_spaceId_fkey";

-- AddForeignKey
ALTER TABLE "DeviceCurrentLocation" ADD CONSTRAINT "DeviceCurrentLocation_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCurrentLocation" ADD CONSTRAINT "DeviceCurrentLocation_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCurrentLocation" ADD CONSTRAINT "DeviceCurrentLocation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLocationHistory" ADD CONSTRAINT "DeviceLocationHistory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLocationHistory" ADD CONSTRAINT "DeviceLocationHistory_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
