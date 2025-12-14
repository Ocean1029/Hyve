-- DropIndex
DROP INDEX "UserLocation_userId_key";

-- CreateIndex
CREATE INDEX "UserLocation_userId_timestamp_idx" ON "UserLocation"("userId", "timestamp");
