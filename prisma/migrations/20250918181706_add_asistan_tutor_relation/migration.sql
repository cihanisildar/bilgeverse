-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assistedTutorId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assistedTutorId_fkey" FOREIGN KEY ("assistedTutorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
