-- AlterTable
ALTER TABLE "ExperienceTransaction" ADD COLUMN     "rolledBack" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PointsTransaction" ADD COLUMN     "rolledBack" BOOLEAN NOT NULL DEFAULT false;
