import "server-only";

import {
  InvitationCreditStatus,
  NominationStatus,
} from "@prisma/client/index";

import { prisma } from "@/lib/db/prisma";

// ─── Credit Transactions (Ledger) ────────────────────────

export async function getCreditBalance(userId: string) {
  const result = await prisma.creditTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function getCreditBalances(
  userIds: string[],
): Promise<Record<string, number>> {
  if (userIds.length === 0) return {};
  const rows = await prisma.creditTransaction.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds } },
    _sum: { amount: true },
  });
  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.userId] = row._sum.amount ?? 0;
  }
  return map;
}

export async function getCreditHistory(userId: string) {
  return prisma.creditTransaction.findMany({
    where: { userId },
    include: {
      nominator: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCreditHistoryPage(
  userId: string,
  page: number,
  pageSize: number,
) {
  const transactions = await prisma.creditTransaction.findMany({
    where: { userId },
    include: {
      nominator: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const total = await prisma.creditTransaction.count({ where: { userId } });
  return { transactions, total };
}

export async function createAdminCreditTransaction(
  adminId: string,
  userId: string,
  amount: number,
  description: string,
) {
  return prisma.creditTransaction.create({
    data: {
      userId,
      amount,
      description,
      nominatorId: adminId,
      approverId: adminId,
    },
  });
}

export async function deleteAdminCreditTransaction(transactionId: string) {
  return prisma.creditTransaction.delete({
    where: { id: transactionId },
  });
}

export async function spendCredits(userId: string, amount: number, description: string) {
  if (amount <= 0) throw new Error("Spend amount must be positive.");

  const balance = await getCreditBalance(userId);
  if (balance < amount) throw new Error("Insufficient credit balance.");

  return prisma.creditTransaction.create({
    data: {
      userId,
      amount: -amount,
      description,
    },
  });
}

// ─── Credit Nominations ──────────────────────────────────

export async function createCreditNomination(
  nominatorId: string,
  userId: string,
  amount: number,
  description: string,
) {
  return prisma.creditNomination.create({
    data: {
      userId,
      nominatorId,
      amount,
      description,
    },
  });
}

export async function getPendingNominations() {
  return prisma.creditNomination.findMany({
    where: { status: NominationStatus.PENDING },
    include: {
      user: { select: { id: true, name: true, email: true } },
      nominator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getNominationsForUser(userId: string) {
  return prisma.creditNomination.findMany({
    where: {
      OR: [{ userId }, { nominatorId: userId }],
    },
    include: {
      user: { select: { id: true, name: true } },
      nominator: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveNomination(nominationId: string, approverId: string) {
  return prisma.$transaction(async (tx) => {
    const nomination = await tx.creditNomination.findUnique({
      where: { id: nominationId },
    });

    if (!nomination || nomination.status !== NominationStatus.PENDING) {
      throw new Error("Nomination not found or not pending.");
    }

    const transaction = await tx.creditTransaction.create({
      data: {
        userId: nomination.userId,
        amount: nomination.amount,
        description: nomination.description,
        nominatorId: nomination.nominatorId,
        approverId,
      },
    });

    return tx.creditNomination.update({
      where: { id: nominationId },
      data: {
        status: NominationStatus.APPROVED,
        approverId,
        creditTransactionId: transaction.id,
      },
    });
  });
}

export async function approveNominationsBulk(nominationIds: string[], approverId: string) {
  const results = [];
  for (const id of nominationIds) {
    results.push(await approveNomination(id, approverId));
  }
  return results;
}

export async function rejectNomination(
  nominationId: string,
  approverId: string,
  rejectionReason: string,
) {
  return prisma.creditNomination.update({
    where: { id: nominationId },
    data: {
      status: NominationStatus.REJECTED,
      approverId,
      rejectionReason,
    },
  });
}

// ─── Invitation Credit Grants ────────────────────────────

export async function createInvitationCreditGrant(
  invitationId: string,
  nominatorId: string,
  amount: number,
  description: string,
) {
  return prisma.invitationCreditGrant.create({
    data: {
      invitationId,
      nominatorId,
      amount,
      description,
    },
  });
}

export async function getInvitationCreditGrants(invitationId: string) {
  return prisma.invitationCreditGrant.findMany({
    where: { invitationId },
    include: {
      nominator: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveInvitationCreditGrant(grantId: string, approverId: string) {
  return prisma.invitationCreditGrant.update({
    where: { id: grantId },
    data: {
      status: InvitationCreditStatus.APPROVED,
      approverId,
    },
  });
}

export async function rejectInvitationCreditGrant(
  grantId: string,
  approverId: string,
  rejectionReason: string,
) {
  return prisma.invitationCreditGrant.update({
    where: { id: grantId },
    data: {
      status: InvitationCreditStatus.REJECTED,
      approverId,
      rejectionReason,
    },
  });
}

export async function getAllPendingInvitationCredits() {
  return prisma.invitationCreditGrant.findMany({
    where: { status: InvitationCreditStatus.PENDING },
    include: {
      invitation: {
        select: { id: true, name: true, email: true, sponsor: { select: { id: true, name: true } } },
      },
      nominator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
