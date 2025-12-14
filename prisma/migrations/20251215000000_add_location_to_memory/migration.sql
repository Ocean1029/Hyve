-- AlterTable: Add location field to Memory
ALTER TABLE "Memory" ADD COLUMN IF NOT EXISTS "location" TEXT;

