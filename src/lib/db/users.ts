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
  const [totalUsers, activeUsers, adminUsers] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
  ]);

  return { totalUsers, activeUsers, adminUsers };
}
