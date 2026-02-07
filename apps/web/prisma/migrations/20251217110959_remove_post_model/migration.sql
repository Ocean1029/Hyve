-- AlterTable
ALTER TABLE "Friend" DROP CONSTRAINT IF EXISTS "Friend_posts_fkey";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_posts_fkey";

-- DropTable
DROP TABLE IF EXISTS "Post";

