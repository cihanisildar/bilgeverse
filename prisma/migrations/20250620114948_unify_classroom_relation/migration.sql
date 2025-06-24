/*
  Warnings:

  - You are about to drop the column `tutorId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tutorId_fkey";

-- DropIndex
DROP INDEX "User_tutorId_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "tutorId";

-- CreateIndex
CREATE INDEX "User_classroomId_idx" ON "User"("classroomId");
