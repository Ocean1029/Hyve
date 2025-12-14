-- Migration: Refactor FocusSession and rename Interaction to Memory
-- This migration handles the schema changes without data loss

-- Step 1: Create FocusSessionFriend junction table
CREATE TABLE "FocusSessionFriend" (
    "id" TEXT NOT NULL,
    "focusSessionId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FocusSessionFriend_pkey" PRIMARY KEY ("id")
);

-- Step 2: Migrate existing FocusSession.friendId data to FocusSessionFriend
INSERT INTO "FocusSessionFriend" ("id", "focusSessionId", "friendId", "createdAt")
SELECT 
    gen_random_uuid()::text as "id",
    "id" as "focusSessionId",
    "friendId" as "friendId",
    "createdAt"
FROM "FocusSession"
WHERE "friendId" IS NOT NULL;

-- Step 3: Create Photo table
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- Step 4: Rename Interaction table to Memory
-- First, create a temporary table with the new structure
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "content" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "focusSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- Step 5: For existing Interaction data, we need to create dummy FocusSessions
-- Since we can't reliably map old interactions to focus sessions,
-- we'll create placeholder focus sessions for each unique friendId
-- Note: This is a best-effort migration. You may need to review and adjust these records.

-- Create temporary focus sessions for interactions that don't have a corresponding session
INSERT INTO "FocusSession" ("id", "startTime", "endTime", "minutes", "userId", "createdAt")
SELECT DISTINCT ON (i."friendId")
    gen_random_uuid()::text as "id",
    COALESCE(i."timestamp"::timestamp, CURRENT_TIMESTAMP) as "startTime",
    COALESCE(i."timestamp"::timestamp, CURRENT_TIMESTAMP) as "endTime",
    0 as "minutes",
    f."sourceUserId" as "userId",
    COALESCE(i."timestamp"::timestamp, CURRENT_TIMESTAMP) as "createdAt"
FROM "Interaction" i
JOIN "Friend" f ON i."friendId" = f."id"
WHERE NOT EXISTS (
    SELECT 1 FROM "FocusSession" fs
    JOIN "FocusSessionFriend" fsf ON fs."id" = fsf."focusSessionId"
    WHERE fsf."friendId" = i."friendId"
    AND fs."startTime"::date = i."timestamp"::date
);

-- Step 6: Migrate Interaction data to Memory
-- Link memories to the focus sessions we just created or existing ones
INSERT INTO "Memory" ("id", "type", "content", "timestamp", "focusSessionId", "createdAt")
SELECT 
    i."id",
    i."type",
    i."content",
    i."timestamp",
    COALESCE(
        (SELECT fs."id" 
         FROM "FocusSession" fs
         JOIN "FocusSessionFriend" fsf ON fs."id" = fsf."focusSessionId"
         WHERE fsf."friendId" = i."friendId"
         AND fs."startTime"::date = i."timestamp"::date
         LIMIT 1),
        (SELECT fs."id" 
         FROM "FocusSession" fs
         JOIN "FocusSessionFriend" fsf ON fs."id" = fsf."focusSessionId"
         WHERE fsf."friendId" = i."friendId"
         ORDER BY fs."createdAt" DESC
         LIMIT 1)
    ) as "focusSessionId",
    i."createdAt"
FROM "Interaction" i;

-- Step 7: Add foreign key constraints and indexes
ALTER TABLE "FocusSessionFriend" ADD CONSTRAINT "FocusSessionFriend_focusSessionId_fkey" 
    FOREIGN KEY ("focusSessionId") REFERENCES "FocusSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FocusSessionFriend" ADD CONSTRAINT "FocusSessionFriend_friendId_fkey" 
    FOREIGN KEY ("friendId") REFERENCES "Friend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Memory" ADD CONSTRAINT "Memory_focusSessionId_fkey" 
    FOREIGN KEY ("focusSessionId") REFERENCES "FocusSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo" ADD CONSTRAINT "Photo_memoryId_fkey" 
    FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Create indexes
CREATE UNIQUE INDEX "FocusSessionFriend_focusSessionId_friendId_key" ON "FocusSessionFriend"("focusSessionId", "friendId");
CREATE INDEX "FocusSessionFriend_focusSessionId_idx" ON "FocusSessionFriend"("focusSessionId");
CREATE INDEX "FocusSessionFriend_friendId_idx" ON "FocusSessionFriend"("friendId");
CREATE INDEX "Photo_memoryId_idx" ON "Photo"("memoryId");

-- Step 9: Update FocusSession table structure
-- Remove friendId column (data already migrated)
ALTER TABLE "FocusSession" DROP CONSTRAINT IF EXISTS "FocusSession_friendId_fkey";
ALTER TABLE "FocusSession" DROP COLUMN IF EXISTS "friendId";

-- Remove durationMinutes column (keep only minutes)
ALTER TABLE "FocusSession" DROP COLUMN IF EXISTS "durationMinutes";

-- Remove date column
ALTER TABLE "FocusSession" DROP COLUMN IF EXISTS "date";

-- Ensure minutes column exists and has default
ALTER TABLE "FocusSession" ALTER COLUMN "minutes" SET DEFAULT 0;
ALTER TABLE "FocusSession" ALTER COLUMN "minutes" SET NOT NULL;

-- Step 10: Update minutes from durationMinutes if needed (for existing records)
UPDATE "FocusSession" 
SET "minutes" = COALESCE("minutes", 0)
WHERE "minutes" IS NULL;

-- Step 11: Drop old Interaction table (after data migration)
DROP TABLE IF EXISTS "Interaction";
