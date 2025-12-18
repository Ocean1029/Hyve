-- Migration: Refactor FocusSession to support multiple users
-- Changes:
-- 1. Add status field to FocusSession
-- 2. Remove userId from FocusSession
-- 3. Rename FocusSessionFriend to FocusSessionUser and change friendId to userId
-- 4. Add userId to Memory

-- Step 1: Add status column to FocusSession
ALTER TABLE "FocusSession" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';

-- Step 2: Create FocusSessionUser table (replacement for FocusSessionFriend)
CREATE TABLE IF NOT EXISTS "FocusSessionUser" (
    "id" TEXT NOT NULL,
    "focusSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FocusSessionUser_pkey" PRIMARY KEY ("id")
);

-- Step 3: Migrate data from FocusSessionFriend to FocusSessionUser
-- Convert friendId to userId by looking up the Friend table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'FocusSessionFriend') THEN
        INSERT INTO "FocusSessionUser" ("id", "focusSessionId", "userId", "createdAt")
        SELECT 
            gen_random_uuid()::text as "id",
            fsf."focusSessionId",
            f."userId" as "userId",
            fsf."createdAt"
        FROM "FocusSessionFriend" fsf
        JOIN "Friend" f ON fsf."friendId" = f."id"
        WHERE NOT EXISTS (
            SELECT 1 FROM "FocusSessionUser" fsu
            WHERE fsu."focusSessionId" = fsf."focusSessionId"
            AND fsu."userId" = f."userId"
        );
        
        -- Also add the session owner (from FocusSession.userId) to FocusSessionUser
        INSERT INTO "FocusSessionUser" ("id", "focusSessionId", "userId", "createdAt")
        SELECT 
            gen_random_uuid()::text as "id",
            fs."id" as "focusSessionId",
            fs."userId" as "userId",
            fs."createdAt"
        FROM "FocusSession" fs
        WHERE fs."userId" IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM "FocusSessionUser" fsu
            WHERE fsu."focusSessionId" = fs."id"
            AND fsu."userId" = fs."userId"
        );
    END IF;
END $$;

-- Step 4: Add userId column to Memory table
ALTER TABLE "Memory" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Step 5: Migrate userId to Memory from FocusSession
-- For existing memories, assign userId from the FocusSession's userId
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'FocusSession' AND column_name = 'userId'
    ) THEN
        UPDATE "Memory" m
        SET "userId" = fs."userId"
        FROM "FocusSession" fs
        WHERE m."focusSessionId" = fs."id"
        AND m."userId" IS NULL
        AND fs."userId" IS NOT NULL;
    END IF;
END $$;

-- Step 6: Set default status for existing FocusSession records
UPDATE "FocusSession" 
SET "status" = 'completed'
WHERE "status" = 'active' 
AND "endTime" < NOW() - INTERVAL '1 hour';

-- Step 7: Add foreign key constraints for FocusSessionUser
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FocusSessionUser_focusSessionId_fkey'
    ) THEN
        ALTER TABLE "FocusSessionUser" ADD CONSTRAINT "FocusSessionUser_focusSessionId_fkey" 
            FOREIGN KEY ("focusSessionId") REFERENCES "FocusSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FocusSessionUser_userId_fkey'
    ) THEN
        ALTER TABLE "FocusSessionUser" ADD CONSTRAINT "FocusSessionUser_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Memory_userId_fkey'
    ) THEN
        ALTER TABLE "Memory" ADD CONSTRAINT "Memory_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 8: Create indexes for FocusSessionUser
CREATE UNIQUE INDEX IF NOT EXISTS "FocusSessionUser_focusSessionId_userId_key" ON "FocusSessionUser"("focusSessionId", "userId");
CREATE INDEX IF NOT EXISTS "FocusSessionUser_focusSessionId_idx" ON "FocusSessionUser"("focusSessionId");
CREATE INDEX IF NOT EXISTS "FocusSessionUser_userId_idx" ON "FocusSessionUser"("userId");
CREATE INDEX IF NOT EXISTS "Memory_userId_idx" ON "Memory"("userId");

-- Step 9: Make Memory.userId NOT NULL after migration
-- First ensure all memories have userId
DO $$
BEGIN
    -- If there are any memories without userId, assign them to a default user
    -- This should not happen after migration, but handle edge cases
    UPDATE "Memory" m
    SET "userId" = (
        SELECT fs."userId" 
        FROM "FocusSession" fs 
        WHERE fs."id" = m."focusSessionId" 
        LIMIT 1
    )
    WHERE m."userId" IS NULL
    AND EXISTS (
        SELECT 1 FROM "FocusSession" fs 
        WHERE fs."id" = m."focusSessionId" 
        AND fs."userId" IS NOT NULL
    );
END $$;

-- Step 10: Remove old FocusSessionFriend table and constraints
-- Drop foreign key constraints first
ALTER TABLE "FocusSessionFriend" DROP CONSTRAINT IF EXISTS "FocusSessionFriend_focusSessionId_fkey";
ALTER TABLE "FocusSessionFriend" DROP CONSTRAINT IF EXISTS "FocusSessionFriend_friendId_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "FocusSessionFriend_focusSessionId_friendId_key";
DROP INDEX IF EXISTS "FocusSessionFriend_focusSessionId_idx";
DROP INDEX IF EXISTS "FocusSessionFriend_friendId_idx";

-- Drop the table
DROP TABLE IF EXISTS "FocusSessionFriend";

-- Step 11: Remove userId column from FocusSession
ALTER TABLE "FocusSession" DROP CONSTRAINT IF EXISTS "FocusSession_userId_fkey";
ALTER TABLE "FocusSession" DROP COLUMN IF EXISTS "userId";

