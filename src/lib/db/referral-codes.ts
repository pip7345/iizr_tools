import "server-only";

import crypto from "crypto";

import { prisma } from "@/lib/db/prisma";

function generateCode(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

export async function createReferralCode(userId: string, expiresInDays = 365) {
  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  return prisma.referralCode.create({
    data: { code, userId, expiresAt },
  });
}

export async function getReferralCodesForUser(userId: string) {
  return prisma.referralCode.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveReferralCode(code: string) {
  const referralCode = await prisma.referralCode.findUnique({
    where: { code },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!referralCode) return null;
  if (referralCode.expiresAt < new Date()) return null;

  return referralCode;
}

export async function deleteReferralCode(codeId: string, userId: string) {
  const code = await prisma.referralCode.findFirst({
    where: { id: codeId, userId },
  });

  if (!code) throw new Error("Referral code not found.");

  return prisma.referralCode.delete({ where: { id: codeId } });
}
