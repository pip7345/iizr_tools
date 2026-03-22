import "server-only";

import { ImpersonationSessionStatus } from "@prisma/client/index";

import { prisma } from "@/lib/db/prisma";

export async function startImpersonation(
  adminId: string,
  impersonatedUserId: string,
  ipAddress?: string,
  userAgent?: string,
) {
  // End any existing active sessions for this admin
  await prisma.impersonationSession.updateMany({
    where: { adminId, status: ImpersonationSessionStatus.ACTIVE },
    data: { status: ImpersonationSessionStatus.ENDED, endedAt: new Date() },
  });

  return prisma.impersonationSession.create({
    data: {
      adminId,
      impersonatedUserId,
      ipAddress,
      userAgent,
    },
  });
}

export async function endImpersonation(adminId: string) {
  return prisma.impersonationSession.updateMany({
    where: { adminId, status: ImpersonationSessionStatus.ACTIVE },
    data: { status: ImpersonationSessionStatus.ENDED, endedAt: new Date() },
  });
}

export async function getActiveImpersonation(adminId: string) {
  return prisma.impersonationSession.findFirst({
    where: { adminId, status: ImpersonationSessionStatus.ACTIVE },
    include: {
      impersonatedUser: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getImpersonationHistory(adminId: string) {
  return prisma.impersonationSession.findMany({
    where: { adminId },
    include: {
      impersonatedUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startedAt: "desc" },
  });
}
