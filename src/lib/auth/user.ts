import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db/prisma";

async function syncUserFromClerk() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Authenticated user could not be loaded.");
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("Authenticated user is missing an email address.");
  }

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    email.split("@")[0];

  return prisma.user.upsert({
    where: {
      clerkId: clerkUser.id,
    },
    update: {
      email,
      name: displayName,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      name: displayName,
    },
  });
}

export async function getUserOrNull() {
  const session = await auth();

  if (!session.userId) {
    return null;
  }

  return syncUserFromClerk();
}

export async function requireUser() {
  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn();
  }

  return syncUserFromClerk();
}
