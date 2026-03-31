import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole, UserStatus } from "@prisma/client/index";

import { prisma } from "@/lib/db/prisma";
import { uniqueReferralCode } from "@/lib/db/users";

const IMPERSONATE_COOKIE = "iizr_impersonate_user_id";
const IMPERSONATE_ADMIN_COOKIE = "iizr_impersonate_admin_id";
const REFERRAL_COOKIE = "iizr_referral_code";
const SIGNUP_COOKIE = "iizr_signup_code";

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

  // 1. Already linked by Clerk ID — just update name/email
  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existing) {
    return prisma.user.update({
      where: { clerkId: clerkUser.id },
      data: { email, name: displayName },
    });
  }

  // 2. Email match — a PENDING_SIGNUP user was created with this email
  const preRegistered = await prisma.user.findUnique({ where: { email } });
  if (preRegistered && preRegistered.clerkId === null) {
    return prisma.user.update({
      where: { id: preRegistered.id },
      data: {
        clerkId: clerkUser.id,
        name: displayName,
        status: UserStatus.ACTIVE,
        signupCode: null,
      },
    });
  }

  const cookieStore = await cookies();

  // 3. Signup code match — invitation link was used (no email match)
  const signupCode = cookieStore.get(SIGNUP_COOKIE)?.value;
  if (signupCode) {
    const pending = await prisma.user.findUnique({ where: { signupCode } });
    if (pending && pending.clerkId === null && pending.status === UserStatus.PENDING_SIGNUP) {
      try { cookieStore.delete(SIGNUP_COOKIE); } catch { /* not mutable in Server Component context */ }
      return prisma.user.update({
        where: { id: pending.id },
        data: {
          clerkId: clerkUser.id,
          email,
          name: displayName,
          status: UserStatus.ACTIVE,
          signupCode: null,
        },
      });
    }
  }

  // 4. Referral code — creates a brand-new user with a sponsor
  const referralCode = cookieStore.get(REFERRAL_COOKIE)?.value;
  let sponsorId: string | undefined;

  if (referralCode) {
    const sponsor = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true, status: true },
    });
    if (sponsor && sponsor.status === UserStatus.ACTIVE) {
      sponsorId = sponsor.id;
    }
    try { cookieStore.delete(REFERRAL_COOKIE); } catch { /* not mutable in Server Component context */ }
  }

  // 5. Create new user
  const code = await uniqueReferralCode(displayName);
  return prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      email,
      name: displayName,
      referralCode: code,
      sponsorId,
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

