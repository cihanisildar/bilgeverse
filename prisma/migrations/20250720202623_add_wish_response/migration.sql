-- AlterTable
ALTER TABLE "Wish" ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "respondedBy" TEXT,
ADD COLUMN     "response" TEXT;
