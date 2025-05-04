/*
  Warnings:

  - You are about to drop the column `response` on the `Wish` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedById` on the `Wish` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Wish` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Wish" DROP CONSTRAINT "Wish_reviewedById_fkey";

-- AlterTable
ALTER TABLE "Wish" DROP COLUMN "response",
DROP COLUMN "reviewedById",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "WishStatus";
