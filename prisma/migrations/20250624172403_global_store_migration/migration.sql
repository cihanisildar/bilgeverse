/*
  Warnings:

  - You are about to drop the column `tutorId` on the `StoreItem` table. All the data in the column will be lost.
  - You are about to drop the column `classroomId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `StoreItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "StoreItem" DROP CONSTRAINT "StoreItem_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_classroomId_fkey";

-- DropIndex
DROP INDEX "StoreItem_name_tutorId_key";

-- AlterTable
ALTER TABLE "StoreItem" DROP COLUMN "tutorId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "classroomId",
ADD COLUMN     "studentClassroomId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "StoreItem_name_key" ON "StoreItem"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_studentClassroomId_fkey" FOREIGN KEY ("studentClassroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
