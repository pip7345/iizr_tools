import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client/index";

import { prisma } from "@/lib/db/prisma";

const IMPERSONATE_COOKIE = "iizr_impersonate_user_id";
const IMPERSONATE_ADMIN_COOKIE = "iizr_impersonate_admin_id";
const REFERRAL_COOKIE = "iizr_referral_code";

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

  // 1. Check if user already exists by Clerk ID
  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existing) {
    return prisma.user.update({
      where: { clerkId: clerkUser.id },
      data: { email, name: displayName },
    });
  }

  // 2. Check if a pre-registered user exists with this email (PENDING_SIGNUP)
  const preRegistered = await prisma.user.findUnique({ where: { email } });
  if (preRegistered && preRegistered.clerkId === null) {
    // Link this Clerk account to the pre-registered record
    return prisma.user.update({
      where: { id: preRegistered.id },
      data: { clerkId: clerkUser.id, name: displayName, status: "ACTIVE" },
    });
  }

  // Read referral cookie once — used by both step 3 and step 4
  const cookieStore = await cookies();
  const referralCode = cookieStore.get(REFERRAL_COOKIE)?.value;

  // 3. Check if the referral code links to a pre-registered user via pendingUserId
  //    This handles the case where the user was created without an email address.
  if (referralCode) {
    const code = await prisma.referralCode.findUnique({
      where: { code: referralCode },
      include: {
        invitations: {
          where: { status: "PENDING", pendingUserId: { not: null } },
          include: { creditGrants: { where: { status: "APPROVED" } } },
          take: 1,
        },
      },
    });

    if (code && code.expiresAt > new Date() && code.invitations[0]?.pendingUserId) {
      const inv = code.invitations[0];
      const pending = await prisma.user.findUnique({ where: { id: inv.pendingUserId! } });

      if (pending?.clerkId === null) {
        const linked = await prisma.user.update({
          where: { id: pending.id },
          data: { clerkId: clerkUser.id, email, name: displayName, status: "ACTIVE" },
        });

        // Convert approved invitation credits to real transactions
        for (const grant of inv.creditGrants) {
          const transaction = await prisma.creditTransaction.create({
            data: {
              userId: linked.id,
              amount: grant.amount,
              description: `Converted from invitation: ${grant.description}`,
              nominatorId: grant.nominatorId,
              approverId: grant.approverId,
            },
          });
          await prisma.invitationCreditGrant.update({
            where: { id: grant.id },
            data: { status: "CONVERTED", creditTransactionId: transaction.id },
          });
        }

        await prisma.invitationCreditGrant.updateMany({
          where: { invitationId: inv.id, status: "PENDING" },
          data: { status: "VOIDED" },
        });

        await prisma.invitation.update({
          where: { id: inv.id },
          data: { status: "CLAIMED", claimedByUserId: linked.id },
        });

        cookieStore.delete(REFERRAL_COOKIE);
        return linked;
      }
    }
  }

  // 4. New user: process referral code for sponsor assignment
  let sponsorId: string | undefined;

  if (referralCode) {
    cookieStore.delete(REFERRAL_COOKIE);

    const code = await prisma.referralCode.findUnique({
      where: { code: referralCode },
      include: { user: true },
    });

    if (code && code.expiresAt > new Date()) {
      sponsorId = code.userId;
    }
  }

  const newUser = await prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      email,
      name: displayName,
      sponsorId,
    },
  });

  // 5. Claim any matching invitation for the new user
  if (referralCode) {
    const code = await prisma.referralCode.findUnique({
      where: { code: referralCode },
    });

    if (code) {
      const invitation = await prisma.invitation.findFirst({
        where: {
          referralCodeId: code.id,
          status: "PENDING",
        },
        include: {
          creditGrants: {
            where: { status: "APPROVED" },
          },
        },
      });

      if (invitation) {
        for (const grant of invitation.creditGrants) {
          const transaction = await prisma.creditTransaction.create({
            data: {
              userId: newUser.id,
              amount: grant.amount,
              description: `Converted from invitation: ${grant.description}`,
              nominatorId: grant.nominatorId,
              approverId: grant.approverId,
            },
          });

          await prisma.invitationCreditGrant.update({
            where: { id: grant.id },
            data: {
              status: "CONVERTED",
              creditTransactionId: transaction.id,
            },
          });
        }

        await prisma.invitationCreditGrant.updateMany({
          where: { invitationId: invitation.id, status: "PENDING" },
          data: { status: "VOIDED" },
        });

        await prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            status: "CLAIMED",
            claimedByUserId: newUser.id,
          },
        });
      }
    }
  }

  return newUser;
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

  const user = await syncUserFromClerk();

  // Check for impersonation
  const cookieStore = await cookies();
  const impersonatedUserId = cookieStore.get(IMPERSONATE_COOKIE)?.value;

  if (impersonatedUserId && user.role === UserRole.ADMIN) {
    const impersonated = await prisma.user.findUnique({
      where: { id: impersonatedUserId },
    });
    if (impersonated) {
      return impersonated;
    }
  }

  return user;
}

export async function requireAdmin() {
  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn();
  }

  const user = await syncUserFromClerk();

  if (user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return user;
}

// Get the real admin identity even during impersonation
export async function getRealUser() {
  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn();
  }

  return syncUserFromClerk();
}

export async function isImpersonating() {
  const cookieStore = await cookies();
  return !!cookieStore.get(IMPERSONATE_COOKIE)?.value;
}

export async function getImpersonationInfo() {
  const cookieStore = await cookies();
  const impersonatedUserId = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  const adminId = cookieStore.get(IMPERSONATE_ADMIN_COOKIE)?.value;

  if (!impersonatedUserId || !adminId) return null;

  const [impersonatedUser, admin] = await Promise.all([
    prisma.user.findUnique({ where: { id: impersonatedUserId }, select: { id: true, name: true, email: true } }),
    prisma.user.findUnique({ where: { id: adminId }, select: { id: true, name: true, email: true } }),
  ]);

  if (!impersonatedUser || !admin) return null;

  return { impersonatedUser, admin };
}

export async function getRequestMeta() {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  };
}

