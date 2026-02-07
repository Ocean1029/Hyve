-- Add userId column to User table
-- Step 1: Add column as nullable first
ALTER TABLE "User" ADD COLUMN "userId" TEXT;

-- Step 2: Initialize userId for existing users (set to id value)
UPDATE "User" SET "userId" = "id";

-- Step 3: Make userId NOT NULL
ALTER TABLE "User" ALTER COLUMN "userId" SET NOT NULL;

-- Step 4: Add unique constraint
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- Step 5: Add length constraint (max 30 characters)
ALTER TABLE "User" ADD CONSTRAINT "User_userId_length_check" CHECK (char_length("userId") <= 30);

-- Step 6: Create trigger function to automatically set userId = id when creating a new user
CREATE OR REPLACE FUNCTION set_user_id_default()
RETURNS TRIGGER AS $$
BEGIN
  -- If userId is not provided or is NULL, set it to id
  IF NEW."userId" IS NULL OR NEW."userId" = '' THEN
    NEW."userId" := NEW."id";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger that fires before insert
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_default();

