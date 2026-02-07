/*
  Warnings:

  - Made the column `userId` on table `Memory` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX IF EXISTS "FocusSessionUser_isPaused_idx";

-- DropIndex
DROP INDEX IF EXISTS "Memory_userId_idx";

-- AlterTable: Drop default from updatedAt if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'FocusSessionUser' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "FocusSessionUser" ALTER COLUMN "updatedAt" DROP DEFAULT;
    END IF;
END $$;

-- AlterTable
ALTER TABLE "Memory" ALTER COLUMN "userId" SET NOT NULL;
