import "server-only";

import crypto from "crypto";

import { CreditStatus, UserRole, UserStatus } from "@prisma/client/index";

import { prisma } from "@/lib/db/prisma";

// ─── Referral Code Generation ────────────────────────────

function generateReferralCode(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase() || "USER";
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${suffix}`;
}

function generateSignupCode(): string {
  return crypto.randomBytes(8).toString("hex");
}

export async function uniqueReferralCode(name: string): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode(name);
    const exists = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  // Fallback: fully random
  return `USER-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

// ─── User Queries ────────────────────────────────────────

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { sponsor: { select: { id: true, name: true, email: true, preferredDisplayName: true } } },
  });
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    include: { sponsor: { select: { id: true, name: true, email: true } } },
  });
}

export async function getAllUsers(filters?: {
  role?: UserRole;
  status?: UserStatus;
  sponsorId?: string;
  hasSponsor?: boolean;
  search?: string;
}) {
  return prisma.user.findMany({
    where: {
      ...(filters?.role && { role: filters.role }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.sponsorId && { sponsorId: filters.sponsorId }),
      ...(filters?.hasSponsor === true && { sponsorId: { not: null } }),
      ...(filters?.hasSponsor === false && { sponsorId: null }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" as const } },
          { email: { contains: filters.search, mode: "insensitive" as const } },
          { preferredDisplayName: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }),
    },
    include: {
      sponsor: { select: { id: true, name: true, email: true } },
      _count: { select: { recruits: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEligibleSponsors(excludeUserId: string) {
  return prisma.user.findMany({
    where: {
      id: { not: excludeUserId },
      status: UserStatus.ACTIVE,
    },
    select: { id: true, name: true, email: true, preferredDisplayName: true },
    orderBy: { name: "asc" },
  });
}

export async function updateUserRole(userId: string, role: UserRole) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function updateUserSponsor(userId: string, sponsorId: string | null) {
  return prisma.user.update({
    where: { id: userId },
    data: { sponsorId },
  });
}

export async function updateUserProfile(
  userId: string,
  data: {
    preferredDisplayName?: string | null;
    bio?: string | null;
    location?: string | null;
  },
) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

export async function selfAssignSponsor(userId: string, sponsorId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sponsorId: true },
  });

  if (user?.sponsorId) {
    throw new Error("You already have a sponsor assigned.");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { sponsorId },
  });
}

// ─── Hierarchy ───────────────────────────────────────────

export async function getRecruitsTree(userId: string) {
  const recruits = await prisma.user.findMany({
    where: { sponsorId: userId },
    select: {
      id: true,
      name: true,
      email: true,
      preferredDisplayName: true,
      role: true,
      status: true,
      joinedAt: true,
      _count: { select: { recruits: true } },
    },
    orderBy: { name: "asc" },
  });

  return recruits;
}

export async function isInDownline(sponsorId: string, targetUserId: string): Promise<boolean> {
  const directRecruits = await prisma.user.findMany({
    where: { sponsorId },
    select: { id: true },
  });

  for (const recruit of directRecruits) {
    if (recruit.id === targetUserId) return true;
    const found = await isInDownline(recruit.id, targetUserId);
    if (found) return true;
  }

  return false;
}

export async function getRootUsers() {
  return prisma.user.findMany({
    where: { sponsorId: null },
    select: {
      id: true,
      name: true,
      email: true,
      preferredDisplayName: true,
      role: true,
      status: true,
      joinedAt: true,
      _count: { select: { recruits: true } },
    },
    orderBy: { name: "asc" },
  });
}

// ─── Profile & Stats ────────────────────────────────────

export async function getUserPublicProfile(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      preferredDisplayName: true,
      bio: true,
      location: true,
      role: true,
      status: true,
      joinedAt: true,
      sponsor: { select: { id: true, name: true, preferredDisplayName: true, email: true } },
      _count: { select: { recruits: true } },
    },
  });
}

export async function getUserStats() {
  const [totalUsers, activeUsers, adminUsers, referredUsers, creditAggregate] = await Promise.all([
    prisma.user.count({ where: { status: { not: UserStatus.INACTIVE } } }),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.user.count({ where: { sponsorId: { not: null }, status: UserStatus.ACTIVE } }),
    prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: { amount: { gt: 0 }, status: CreditStatus.APPROVED },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    adminUsers,
    referredUsers,
    totalCreditsIssued: creditAggregate._sum.amount ?? 0,
  };
}

export async function getLeaderboardPage(page: number, pageSize: number) {
  type LeaderboardRow = {
    id: string;
    name: string | null;
    preferredDisplayName: string | null;
    credits: bigint;
    referrals: bigint;
  };

  const offset = (page - 1) * pageSize;

  const [rows, total] = await Promise.all([
    prisma.$queryRaw<LeaderboardRow[]>`
      SELECT
        u.id,
        u.name,
        u."preferredDisplayName",
        COALESCE((SELECT SUM(ct.amount) FROM "CreditTransaction" ct WHERE ct."userId" = u.id AND ct.status = 'APPROVED'), 0)::bigint AS credits,
        (SELECT COUNT(*) FROM "User" r WHERE r."sponsorId" = u.id AND r.status = 'ACTIVE')::bigint AS referrals
      FROM "User" u
      WHERE u.status = 'ACTIVE'
      ORDER BY credits DESC, referrals DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
  ]);

  return {
    entries: rows.map((r) => ({
      id: r.id,
      name: r.preferredDisplayName ?? r.name ?? "Unknown",
      credits: Number(r.credits),
      referrals: Number(r.referrals),
    })),
    total,
  };
}

// ─── Invitation Management (now creates users) ──────────

export async function createInvitation(
  sponsorId: string,
  input: { name: string; email?: string | null },
) {
  const referralCode = await uniqueReferralCode(input.name);
  const signupCode = generateSignupCode();

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email || null,
      sponsorId,
      status: UserStatus.PENDING_SIGNUP,
      referralCode,
      signupCode,
    },
  });
}

export async function getInvitationsForSponsor(sponsorId: string) {
  return prisma.user.findMany({
    where: { sponsorId, status: UserStatus.PENDING_SIGNUP },
    include: {
      creditTransactions: {
        where: { status: { in: [CreditStatus.PENDING, CreditStatus.APPROVED] } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingInvitations() {
  return prisma.user.findMany({
    where: { status: UserStatus.PENDING_SIGNUP },
    include: {
      sponsor: { select: { id: true, name: true, email: true } },
      creditTransactions: {
        where: { status: { in: [CreditStatus.PENDING, CreditStatus.APPROVED] } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateInvitation(
  invitationUserId: string,
  sponsorId: string,
  input: { name: string; email?: string | null },
) {
  const user = await prisma.user.findFirst({
    where: { id: invitationUserId, sponsorId, status: UserStatus.PENDING_SIGNUP },
  });

  if (!user) {
    throw new Error("Invitation not found or not editable.");
  }

  return prisma.user.update({
    where: { id: invitationUserId },
    data: { name: input.name, email: input.email || null },
  });
}

export async function deleteInvitation(invitationUserId: string, sponsorId: string) {
  const user = await prisma.user.findFirst({
    where: { id: invitationUserId, sponsorId, status: UserStatus.PENDING_SIGNUP },
  });

  if (!user) {
    throw new Error("Invitation not found or already claimed.");
  }

  // Reject any pending credits, keep approved for audit
  await prisma.creditTransaction.updateMany({
    where: { userId: invitationUserId, status: CreditStatus.PENDING },
    data: { status: CreditStatus.REJECTED, rejectionReason: "Invitation canceled" },
  });

  // Set to INACTIVE, null out email and signupCode to free unique slots
  return prisma.user.update({
    where: { id: invitationUserId },
    data: {
      status: UserStatus.INACTIVE,
      email: null,
      signupCode: null,
    },
  });
}

// ─── Referral Code Resolution ────────────────────────────

export async function resolveReferralCode(code: string) {
  return prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, name: true, email: true, status: true },
  });
}

export async function resolveSignupCode(code: string) {
  return prisma.user.findUnique({
    where: { signupCode: code },
    select: { id: true, name: true, email: true, status: true, clerkId: true, signupCode: true },
  });
}

// ─── Utility ─────────────────────────────────────────────

export async function getUsersWithEmails(emails: string[]): Promise<Set<string>> {
  if (emails.length === 0) return new Set();
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  return new Set(users.map((u) => u.email).filter((e): e is string => e !== null));
}
