-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'PENDING_SIGNUP';

-- AlterTable: make clerkId nullable to support pre-registered users
ALTER TABLE "User" ALTER COLUMN "clerkId" DROP NOT NULL;
