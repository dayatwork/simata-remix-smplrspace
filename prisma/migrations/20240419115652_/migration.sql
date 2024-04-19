/*
  Warnings:

  - You are about to drop the `DeviceLocation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DeviceLocation" DROP CONSTRAINT "DeviceLocation_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceLocation" DROP CONSTRAINT "DeviceLocation_roomId_fkey";

-- DropTable
DROP TABLE "DeviceLocation";

-- CreateTable
CREATE TABLE "DeviceCurrentLocation" (
    "deviceId" INTEGER NOT NULL,
    "spaceId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "levelIndex" INTEGER,
    "elevation" DOUBLE PRECISION,
    "x" DOUBLE PRECISION,
    "z" DOUBLE PRECISION
);

-- CreateTable
CREATE TABLE "DeviceLocationHistory" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "spaceId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceLocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceCurrentLocation_deviceId_key" ON "DeviceCurrentLocation"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceCurrentLocation_spaceId_idx" ON "DeviceCurrentLocation"("spaceId");

-- CreateIndex
CREATE INDEX "DeviceCurrentLocation_roomId_idx" ON "DeviceCurrentLocation"("roomId");

-- CreateIndex
CREATE INDEX "DeviceLocationHistory_roomId_idx" ON "DeviceLocationHistory"("roomId");

-- CreateIndex
CREATE INDEX "DeviceLocationHistory_deviceId_idx" ON "DeviceLocationHistory"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceLocationHistory_deviceId_timestamp_idx" ON "DeviceLocationHistory"("deviceId", "timestamp");

-- AddForeignKey
ALTER TABLE "DeviceCurrentLocation" ADD CONSTRAINT "DeviceCurrentLocation_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCurrentLocation" ADD CONSTRAINT "DeviceCurrentLocation_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCurrentLocation" ADD CONSTRAINT "DeviceCurrentLocation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLocationHistory" ADD CONSTRAINT "DeviceLocationHistory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLocationHistory" ADD CONSTRAINT "DeviceLocationHistory_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLocationHistory" ADD CONSTRAINT "DeviceLocationHistory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
