-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "createdForTutorId" TEXT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdForTutorId_fkey" FOREIGN KEY ("createdForTutorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
