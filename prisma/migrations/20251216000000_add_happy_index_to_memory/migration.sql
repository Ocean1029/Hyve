-- AlterTable: Add happyIndex field to Memory
ALTER TABLE "Memory" ADD COLUMN IF NOT EXISTS "happyIndex" INTEGER;

