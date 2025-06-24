-- DropIndex
DROP INDEX "User_classroomId_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tutorId" TEXT;

-- CreateIndex
CREATE INDEX "User_tutorId_idx" ON "User"("tutorId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
