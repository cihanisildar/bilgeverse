/*
  Warnings:

  - A unique constraint covering the columns `[name,tutorId]` on the table `StoreItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tutorId` to the `StoreItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StoreItem" ADD COLUMN     "tutorId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "StoreItem_name_tutorId_key" ON "StoreItem"("name", "tutorId");

-- AddForeignKey
ALTER TABLE "StoreItem" ADD CONSTRAINT "StoreItem_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
