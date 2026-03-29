import "server-only";

import { UserRole, UserStatus } from "@prisma/client/index";

import { prisma } from "@/lib/db/prisma";

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

// Recursive hierarchy: get all recruits under a user
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

// Check if targetUserId is in the downline of sponsorId
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

// Get top-level users (no sponsor) for full hierarchy
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
    prisma.user.count(),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.user.count({ where: { sponsorId: { not: null } } }),
    prisma.creditTransaction.aggregate({ _sum: { amount: true }, where: { amount: { gt: 0 } } }),
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
        COALESCE((SELECT SUM(ct.amount) FROM "CreditTransaction" ct WHERE ct."userId" = u.id), 0)::bigint AS credits,
        (SELECT COUNT(*) FROM "User" r WHERE r."sponsorId" = u.id)::bigint AS referrals
      FROM "User" u
      ORDER BY credits DESC, referrals DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    prisma.user.count(),
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

export async function createUserFromInvitation(invitationId: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId, status: "PENDING" },
  });

  if (!invitation) {
    throw new Error("Invitation not found or not pending.");
  }

  if (!invitation.email) {
    throw new Error("Cannot create user: this invitation has no email address.");
  }

  const existing = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  return prisma.user.create({
    data: {
      email: invitation.email,
      name: invitation.name,
      sponsorId: invitation.sponsorId,
      status: UserStatus.PENDING_SIGNUP,
    },
  });
}

export async function getUsersWithEmails(emails: string[]): Promise<Set<string>> {
  if (emails.length === 0) return new Set();
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  return new Set(users.map((u) => u.email));
}
