import "server-only";

import {
  InvitationCreditStatus,
  InvitationStatus,
} from "@prisma/client/index";

import { prisma } from "@/lib/db/prisma";
import { createReferralCode } from "@/lib/db/referral-codes";

export async function createInvitation(
  sponsorId: string,
  input: { name: string; email: string },
) {
  // Create a dedicated referral code for this invitation
  const referralCode = await createReferralCode(sponsorId);

  return prisma.invitation.create({
    data: {
      name: input.name,
      email: input.email,
      sponsorId,
      referralCodeId: referralCode.id,
    },
    include: { referralCode: true },
  });
}

export async function getInvitationsForSponsor(sponsorId: string) {
  return prisma.invitation.findMany({
    where: { sponsorId },
    include: {
      referralCode: true,
      creditGrants: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingInvitations() {
  return prisma.invitation.findMany({
    where: { status: InvitationStatus.PENDING },
    include: {
      sponsor: { select: { id: true, name: true, email: true } },
      referralCode: true,
      creditGrants: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteInvitation(invitationId: string, sponsorId: string) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, sponsorId, status: InvitationStatus.PENDING },
  });

  if (!invitation) {
    throw new Error("Invitation not found or already claimed.");
  }

  // Void any pending/approved credit grants
  await prisma.invitationCreditGrant.updateMany({
    where: {
      invitationId,
      status: { in: [InvitationCreditStatus.PENDING, InvitationCreditStatus.APPROVED] },
    },
    data: { status: InvitationCreditStatus.VOIDED },
  });

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.CANCELED },
  });
}

export async function claimInvitation(invitationId: string, claimedByUserId: string) {
  return prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({
      where: { id: invitationId },
      include: {
        creditGrants: {
          where: { status: InvitationCreditStatus.APPROVED },
        },
      },
    });

    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new Error("Invitation is not available for claiming.");
    }

    // Convert approved invitation credits to real user transactions
    for (const grant of invitation.creditGrants) {
      const transaction = await tx.creditTransaction.create({
        data: {
          userId: claimedByUserId,
          amount: grant.amount,
          description: `Converted from invitation: ${grant.description}`,
          nominatorId: grant.nominatorId,
          approverId: grant.approverId,
        },
      });

      await tx.invitationCreditGrant.update({
        where: { id: grant.id },
        data: {
          status: InvitationCreditStatus.CONVERTED,
          creditTransactionId: transaction.id,
        },
      });
    }

    // Void any still-pending grants
    await tx.invitationCreditGrant.updateMany({
      where: {
        invitationId,
        status: InvitationCreditStatus.PENDING,
      },
      data: { status: InvitationCreditStatus.VOIDED },
    });

    // Mark invitation as claimed
    return tx.invitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.CLAIMED,
        claimedByUserId,
      },
    });
  });
}

// Find invitation by referral code (for signup flow)
export async function findPendingInvitationByCode(code: string) {
  return prisma.invitation.findFirst({
    where: {
      referralCode: { code },
      status: InvitationStatus.PENDING,
    },
    include: { referralCode: true, sponsor: { select: { id: true, name: true } } },
  });
}
