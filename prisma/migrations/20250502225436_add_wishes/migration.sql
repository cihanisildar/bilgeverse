-- CreateEnum
CREATE TYPE "WishStatus" AS ENUM ('PENDING', 'REVIEWED', 'IMPLEMENTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Wish" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "WishStatus" NOT NULL DEFAULT 'PENDING',
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "reviewedById" TEXT,

    CONSTRAINT "Wish_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
