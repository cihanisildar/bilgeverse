-- CreateTable
CREATE TABLE "ExperienceTransaction" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,

    CONSTRAINT "ExperienceTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExperienceTransaction" ADD CONSTRAINT "ExperienceTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceTransaction" ADD CONSTRAINT "ExperienceTransaction_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
