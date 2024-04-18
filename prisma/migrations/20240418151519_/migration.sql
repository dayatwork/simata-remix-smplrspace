/*
  Warnings:

  - You are about to drop the column `groupId` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the `RoomGroup` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `spaceId` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_groupId_fkey";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "groupId",
ADD COLUMN     "spaceId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "RoomGroup";

-- CreateTable
CREATE TABLE "Space" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "smplrSpaceId" TEXT,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
