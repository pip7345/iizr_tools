-- AlterTable: make User.email nullable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable: add pendingUserId to Invitation
ALTER TABLE "Invitation" ADD COLUMN "pendingUserId" TEXT;

-- CreateIndex: unique constraint on pendingUserId
CREATE UNIQUE INDEX "Invitation_pendingUserId_key" ON "Invitation"("pendingUserId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_pendingUserId_fkey" FOREIGN KEY ("pendingUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
