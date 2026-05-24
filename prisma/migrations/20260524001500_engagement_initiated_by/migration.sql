-- Add initiatedById column to Engagement.
-- Existing rows: default to buyerId (matches old behavior where only the buyer could initiate).

-- Step 1: add column as nullable
ALTER TABLE "Engagement" ADD COLUMN "initiatedById" TEXT;

-- Step 2: backfill — existing engagements were buyer-initiated by definition
UPDATE "Engagement" SET "initiatedById" = "buyerId" WHERE "initiatedById" IS NULL;

-- Step 3: enforce NOT NULL
ALTER TABLE "Engagement" ALTER COLUMN "initiatedById" SET NOT NULL;

-- Step 4: add the FK constraint
ALTER TABLE "Engagement"
  ADD CONSTRAINT "Engagement_initiatedById_fkey"
  FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
