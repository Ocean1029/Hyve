-- Update existing memory.type values to default vibe check value
UPDATE "Memory" SET type = '📚 Study' WHERE type IN ('message', 'call', 'meet', 'note');

-- AlterTable: Update default value for type column
ALTER TABLE "Memory" ALTER COLUMN "type" SET DEFAULT '📚 Study';

