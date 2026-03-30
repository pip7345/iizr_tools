import "server-only";

import { CreditStatus } from "@prisma/client/index";

import { prisma } from "@/lib/db/prisma";

// ─── Credit Categories ──────────────────────────────────

export async function getCreditCategories() {
  return prisma.creditCategory.findMany({
    select: { name: true, defaultAmount: true },
    orderBy: { name: "asc" },
  });
}

// ─── Credit Balance (only APPROVED counts) ───────────────

export async function getCreditBalance(userId: string) {
  const result = await prisma.creditTransaction.aggregate({
    where: { userId, status: CreditStatus.APPROVED },
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
    where: { userId: { in: userIds }, status: CreditStatus.APPROVED },
    _sum: { amount: true },
  });
  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.userId] = row._sum.amount ?? 0;
  }
  return map;
}

// ─── Credit History ──────────────────────────────────────

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

// ─── Admin Direct Credits ────────────────────────────────

export async function createAdminCreditTransaction(
  adminId: string,
  userId: string,
  amount: number,
  description: string,
  category = "admin",
) {
  return prisma.creditTransaction.create({
    data: {
      userId,
      amount,
      description,
      category,
      status: CreditStatus.APPROVED,
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

export async function updateAdminCreditTransaction(
  transactionId: string,
  amount: number,
  description: string,
) {
  return prisma.creditTransaction.update({
    where: { id: transactionId },
    data: { amount, description },
  });
}

// ─── Spend Credits ───────────────────────────────────────

export async function spendCredits(userId: string, amount: number, description: string) {
  if (amount <= 0) throw new Error("Spend amount must be positive.");

  const balance = await getCreditBalance(userId);
  if (balance < amount) throw new Error("Insufficient credit balance.");

  return prisma.creditTransaction.create({
    data: {
      userId,
      amount: -amount,
      description,
      category: "spend",
      status: CreditStatus.APPROVED,
    },
  });
}

// ─── Credit Nominations (unified — was CreditNomination) ─

export async function createCreditNomination(
  nominatorId: string,
  userId: string,
  amount: number,
  description: string,
  category = "",
) {
  return prisma.creditTransaction.create({
    data: {
      userId,
      nominatorId,
      amount,
      description,
      category,
      status: CreditStatus.PENDING,
    },
  });
}

export async function getPendingNominations() {
  return prisma.creditTransaction.findMany({
    where: {
      status: CreditStatus.PENDING,
      nominatorId: { not: null },
    },
    include: {
      user: { select: { id: true, name: true, email: true, status: true } },
      nominator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getNominationsForUser(userId: string) {
  return prisma.creditTransaction.findMany({
    where: {
      nominatorId: { not: null },
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
  const nomination = await prisma.creditTransaction.findUnique({
    where: { id: nominationId },
  });

  if (!nomination || nomination.status !== CreditStatus.PENDING) {
    throw new Error("Nomination not found or not pending.");
  }

  return prisma.creditTransaction.update({
    where: { id: nominationId },
    data: {
      status: CreditStatus.APPROVED,
      approverId,
    },
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
  return prisma.creditTransaction.update({
    where: { id: nominationId },
    data: {
      status: CreditStatus.REJECTED,
      approverId,
      rejectionReason,
    },
  });
}


