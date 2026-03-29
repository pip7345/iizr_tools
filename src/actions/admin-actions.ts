"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client/index";

import { requireAdmin, getRealUser, getRequestMeta } from "@/lib/auth/user";
import { updateUserRole, updateUserSponsor, createUserFromInvitation } from "@/lib/db/users";
import {
  createAdminCreditTransaction,
  deleteAdminCreditTransaction,
  updateAdminCreditTransaction,
  approveNomination,
  approveNominationsBulk,
  rejectNomination,
  approveInvitationCreditGrant,
  rejectInvitationCreditGrant,
} from "@/lib/db/credits";
import {
  startImpersonation,
  endImpersonation,
} from "@/lib/db/impersonation";
import { createInvitation } from "@/lib/db/invitations";
import { adminCreditSchema, adminUpdateCreditSchema, rejectionReasonSchema, adminInvitationSchema } from "@/lib/validation/schemas";

import type { ActionState } from "@/actions/user-actions";

const IMPERSONATE_COOKIE = "iizr_impersonate_user_id";
const IMPERSONATE_ADMIN_COOKIE = "iizr_impersonate_admin_id";

// ─── Role Management ─────────────────────────────────────

export async function adminCreateUserFromInvitationAction(
  invitationId: string,
): Promise<ActionState> {
  await requireAdmin();

  try {
    await createUserFromInvitation(invitationId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create user.";
    return { status: "error", message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/invitations");
  return { status: "success", message: "User pre-registered successfully." };
}

export async function adminCreateInvitationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = adminInvitationSchema.safeParse({
    sponsorId: formData.get("sponsorId"),
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the validation errors.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createInvitation(parsed.data.sponsorId, {
      name: parsed.data.name,
      email: parsed.data.email || null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create invitation.";
    return { status: "error", message };
  }

  revalidatePath("/admin/invitations");
  revalidatePath("/dashboard");
  return { status: "success", message: "Invitation created." };
}

export async function grantAdminAction(userId: string): Promise<ActionState> {
  await requireAdmin();

  try {
    await updateUserRole(userId, UserRole.ADMIN);
  } catch {
    return { status: "error", message: "Could not grant admin." };
  }

  revalidatePath("/admin/users");
  return { status: "success", message: "Admin role granted." };
}

export async function revokeAdminAction(userId: string): Promise<ActionState> {
  const admin = await requireAdmin();

  if (admin.id === userId) {
    return { status: "error", message: "You cannot remove your own admin role." };
  }

  try {
    await updateUserRole(userId, UserRole.USER);
  } catch {
    return { status: "error", message: "Could not revoke admin." };
  }

  revalidatePath("/admin/users");
  return { status: "success", message: "Admin role revoked." };
}

// ─── Sponsor Reassignment ────────────────────────────────

export async function reassignSponsorAction(userId: string, sponsorId: string | null): Promise<ActionState> {
  await requireAdmin();

  try {
    await updateUserSponsor(userId, sponsorId);
  } catch {
    return { status: "error", message: "Could not reassign sponsor." };
  }

  revalidatePath("/admin/users");
  return { status: "success", message: "Sponsor reassigned." };
}

// ─── Impersonation ───────────────────────────────────────

export async function startImpersonationAction(impersonatedUserId: string): Promise<ActionState> {
  const admin = await requireAdmin();
  const { ipAddress, userAgent } = await getRequestMeta();

  try {
    await startImpersonation(admin.id, impersonatedUserId, ipAddress, userAgent);

    const cookieStore = await cookies();
    cookieStore.set(IMPERSONATE_COOKIE, impersonatedUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    cookieStore.set(IMPERSONATE_ADMIN_COOKIE, admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  } catch {
    return { status: "error", message: "Could not start impersonation." };
  }

  revalidatePath("/");
  return { status: "success", message: "Now impersonating user." };
}

export async function stopImpersonationAction(): Promise<void> {
  const admin = await getRealUser();
  await endImpersonation(admin.id);

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
  cookieStore.delete(IMPERSONATE_ADMIN_COOKIE);

  revalidatePath("/");
}

// ─── Credit Administration ───────────────────────────────

export async function adminCreateCreditAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = adminCreditSchema.safeParse({
    userId: formData.get("userId"),
    amount: formData.get("amount"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the validation errors.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createAdminCreditTransaction(
      admin.id,
      parsed.data.userId,
      parsed.data.amount,
      parsed.data.description,
    );
  } catch {
    return { status: "error", message: "Could not create credit." };
  }

  revalidatePath("/admin/credits");
  revalidatePath(`/users/${parsed.data.userId}`);
  return { status: "success", message: "Credit transaction created." };
}

export async function adminUpdateCreditAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = adminUpdateCreditSchema.safeParse({
    transactionId: formData.get("transactionId"),
    amount: formData.get("amount"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the validation errors.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await updateAdminCreditTransaction(
      parsed.data.transactionId,
      parsed.data.amount,
      parsed.data.description,
    );
  } catch {
    return { status: "error", message: "Could not update credit." };
  }

  const userId = formData.get("userId") as string | null;
  revalidatePath("/admin/credits");
  if (userId) revalidatePath(`/users/${userId}`);
  return { status: "success", message: "Credit transaction updated." };
}

export async function adminDeleteCreditAction(transactionId: string, userId?: string): Promise<ActionState> {
  await requireAdmin();

  try {
    await deleteAdminCreditTransaction(transactionId);
  } catch {
    return { status: "error", message: "Could not delete credit." };
  }

  revalidatePath("/admin/credits");
  if (userId) revalidatePath(`/users/${userId}`);
  return { status: "success", message: "Credit transaction deleted." };
}

// ─── Nomination Approval ─────────────────────────────────

export async function approveNominationAction(nominationId: string): Promise<ActionState> {
  const admin = await requireAdmin();

  try {
    await approveNomination(nominationId, admin.id);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not approve nomination.",
    };
  }

  revalidatePath("/admin/nominations");
  return { status: "success", message: "Nomination approved." };
}

export async function approveNominationsBulkAction(nominationIds: string[]): Promise<ActionState> {
  const admin = await requireAdmin();

  try {
    await approveNominationsBulk(nominationIds, admin.id);
  } catch {
    return { status: "error", message: "Could not approve all nominations." };
  }

  revalidatePath("/admin/nominations");
  return { status: "success", message: `${nominationIds.length} nomination(s) approved.` };
}

export async function rejectNominationAction(
  nominationId: string,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = rejectionReasonSchema.safeParse({
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Rejection reason is required." };
  }

  try {
    await rejectNomination(nominationId, admin.id, parsed.data.reason);
  } catch {
    return { status: "error", message: "Could not reject nomination." };
  }

  revalidatePath("/admin/nominations");
  return { status: "success", message: "Nomination rejected." };
}

// ─── Invitation Credit Approval ──────────────────────────

export async function approveInvitationCreditAction(grantId: string): Promise<ActionState> {
  const admin = await requireAdmin();

  try {
    await approveInvitationCreditGrant(grantId, admin.id);
  } catch {
    return { status: "error", message: "Could not approve invitation credit." };
  }

  revalidatePath("/admin/nominations");
  return { status: "success", message: "Invitation credit approved." };
}

export async function rejectInvitationCreditAction(
  grantId: string,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = rejectionReasonSchema.safeParse({
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Rejection reason is required." };
  }

  try {
    await rejectInvitationCreditGrant(grantId, admin.id, parsed.data.reason);
  } catch {
    return { status: "error", message: "Could not reject invitation credit." };
  }

  revalidatePath("/admin/nominations");
  return { status: "success", message: "Invitation credit rejected." };
}
