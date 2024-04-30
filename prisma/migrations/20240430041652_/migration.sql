-- DropForeignKey
ALTER TABLE "DeviceLocationHistory" DROP CONSTRAINT "DeviceLocationHistory_roomId_fkey";

-- AddForeignKey
ALTER TABLE "DeviceLocationHistory" ADD CONSTRAINT "DeviceLocationHistory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
