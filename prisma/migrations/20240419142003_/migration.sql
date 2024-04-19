/*
  Warnings:

  - Made the column `levelIndex` on table `DeviceCurrentLocation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `elevation` on table `DeviceCurrentLocation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `x` on table `DeviceCurrentLocation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `z` on table `DeviceCurrentLocation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DeviceCurrentLocation" ALTER COLUMN "levelIndex" SET NOT NULL,
ALTER COLUMN "levelIndex" SET DEFAULT 0,
ALTER COLUMN "elevation" SET NOT NULL,
ALTER COLUMN "elevation" SET DEFAULT 0,
ALTER COLUMN "x" SET NOT NULL,
ALTER COLUMN "x" SET DEFAULT 0,
ALTER COLUMN "z" SET NOT NULL,
ALTER COLUMN "z" SET DEFAULT 0;
