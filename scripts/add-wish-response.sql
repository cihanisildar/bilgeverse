-- Add response fields to Wish table
ALTER TABLE "Wish" ADD COLUMN IF NOT EXISTS "response" TEXT;
ALTER TABLE "Wish" ADD COLUMN IF NOT EXISTS "respondedAt" TIMESTAMP(3);
ALTER TABLE "Wish" ADD COLUMN IF NOT EXISTS "respondedBy" TEXT; 