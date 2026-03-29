-- AlterTable: make email nullable on Invitation
ALTER TABLE "Invitation" ALTER COLUMN "email" DROP NOT NULL;
