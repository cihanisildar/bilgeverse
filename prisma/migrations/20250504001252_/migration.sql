/*
  Warnings:

  - You are about to drop the `StudentNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentReport` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StudentNote" DROP CONSTRAINT "StudentNote_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentNote" DROP CONSTRAINT "StudentNote_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "StudentReport" DROP CONSTRAINT "StudentReport_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentReport" DROP CONSTRAINT "StudentReport_tutorId_fkey";

-- DropTable
DROP TABLE "StudentNote";

-- DropTable
DROP TABLE "StudentReport";
