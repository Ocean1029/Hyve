-- Migration: Add isPaused field to FocusSessionUser
-- This field tracks if a user has paused the session (picked up phone)

-- Add isPaused column to FocusSessionUser
ALTER TABLE "FocusSessionUser" ADD COLUMN IF NOT EXISTS "isPaused" BOOLEAN NOT NULL DEFAULT false;

-- Add updatedAt column for tracking when the pause status changes
ALTER TABLE "FocusSessionUser" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create index on isPaused for faster queries
CREATE INDEX IF NOT EXISTS "FocusSessionUser_isPaused_idx" ON "FocusSessionUser"("isPaused");

