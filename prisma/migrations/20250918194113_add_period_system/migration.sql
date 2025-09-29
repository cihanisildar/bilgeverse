-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Period" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "PeriodStatus" NOT NULL DEFAULT 'INACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Period_name_key" ON "Period"("name");
CREATE INDEX "Period_status_idx" ON "Period"("status");

-- Create a legacy period for existing data
INSERT INTO "Period" ("id", "name", "description", "startDate", "endDate", "status", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'Legacy Data',
    'Contains all data from before the period system was implemented',
    '2024-01-01'::timestamp,
    '2024-12-31'::timestamp,
    'ARCHIVED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Get the legacy period ID for use in subsequent operations
-- We'll store it in a temporary variable by using a CTE approach

-- Step 1: Add periodId columns as nullable first
ALTER TABLE "Event" ADD COLUMN "periodId" TEXT;
ALTER TABLE "ItemRequest" ADD COLUMN "periodId" TEXT;
ALTER TABLE "PointsTransaction" ADD COLUMN "periodId" TEXT;
ALTER TABLE "ExperienceTransaction" ADD COLUMN "periodId" TEXT;
ALTER TABLE "Wish" ADD COLUMN "periodId" TEXT;
ALTER TABLE "StudentNote" ADD COLUMN "periodId" TEXT;
ALTER TABLE "StudentReport" ADD COLUMN "periodId" TEXT;
ALTER TABLE "Announcement" ADD COLUMN "periodId" TEXT;
ALTER TABLE "TransactionRollback" ADD COLUMN "periodId" TEXT;

-- Step 2: Update all existing records to point to the legacy period
UPDATE "Event" SET "periodId" = (SELECT "id" FROM "Period" WHERE "name" = 'Legacy Data' LIMIT 1);
UPDATE "ItemRequest" SET "periodId" = (SELECT "id" FROM "Period" WHERE "name" = 'Legacy Data' LIMIT 1);
UPDATE "PointsTransaction" SET "periodId" = (SELECT "id" FROM "Period" WHERE "name" = 'Legacy Data' LIMIT 1);
UPDATE "ExperienceTransaction" SET "periodId" = (SELECT "id" FROM "Period" WHERE "name" = 'Legacy Data' LIMIT 1);
UPDATE "Wish" SET "periodId" = (SELECT "id" FROM "Period" WHERE "name" = 'Legacy Data' LIMIT 1);
UPDATE "StudentNote" SET "periodId" = (SELECT "id" FROM "Period" WHERE "name" = 'Legacy Data' LIMIT 1);
UPDATE "StudentReport" SET "periodId" = (SELECT "id" FROM "Period" WHERE "name" = 'Legacy Data' LIMIT 1);
UPDATE "Announcement" SET "periodId" = (SELECT "id" FROM "Period" WHERE "name" = 'Legacy Data' LIMIT 1);
UPDATE "TransactionRollback" SET "periodId" = (SELECT "id" FROM "Period" WHERE "name" = 'Legacy Data' LIMIT 1);

-- Step 3: Make periodId columns NOT NULL now that they have values
ALTER TABLE "Event" ALTER COLUMN "periodId" SET NOT NULL;
ALTER TABLE "ItemRequest" ALTER COLUMN "periodId" SET NOT NULL;
ALTER TABLE "PointsTransaction" ALTER COLUMN "periodId" SET NOT NULL;
ALTER TABLE "ExperienceTransaction" ALTER COLUMN "periodId" SET NOT NULL;
ALTER TABLE "Wish" ALTER COLUMN "periodId" SET NOT NULL;
ALTER TABLE "StudentNote" ALTER COLUMN "periodId" SET NOT NULL;
ALTER TABLE "StudentReport" ALTER COLUMN "periodId" SET NOT NULL;
ALTER TABLE "Announcement" ALTER COLUMN "periodId" SET NOT NULL;
ALTER TABLE "TransactionRollback" ALTER COLUMN "periodId" SET NOT NULL;

-- Step 4: Create indexes
CREATE INDEX "Event_periodId_idx" ON "Event"("periodId");
CREATE INDEX "ItemRequest_periodId_idx" ON "ItemRequest"("periodId");
CREATE INDEX "PointsTransaction_periodId_idx" ON "PointsTransaction"("periodId");
CREATE INDEX "ExperienceTransaction_periodId_idx" ON "ExperienceTransaction"("periodId");
CREATE INDEX "Wish_periodId_idx" ON "Wish"("periodId");
CREATE INDEX "StudentNote_periodId_idx" ON "StudentNote"("periodId");
CREATE INDEX "StudentReport_periodId_idx" ON "StudentReport"("periodId");
CREATE INDEX "Announcement_periodId_idx" ON "Announcement"("periodId");
CREATE INDEX "TransactionRollback_periodId_idx" ON "TransactionRollback"("periodId");

-- Step 5: Add foreign key constraints
ALTER TABLE "Event" ADD CONSTRAINT "Event_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItemRequest" ADD CONSTRAINT "ItemRequest_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExperienceTransaction" ADD CONSTRAINT "ExperienceTransaction_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentNote" ADD CONSTRAINT "StudentNote_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TransactionRollback" ADD CONSTRAINT "TransactionRollback_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;