"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/user";
import {
  createInvitation,
  deleteInvitation,
  updateInvitation,
} from "@/lib/db/invitations";
import { createInvitationCreditGrant } from "@/lib/db/credits";
import { invitationSchema, invitationCreditGrantSchema, updateInvitationSchema } from "@/lib/validation/schemas";

import type { ActionState } from "@/actions/user-actions";

export async function createInvitationAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = invitationSchema.safeParse({
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
    await createInvitation(user.id, parsed.data);
  } catch {
    return { status: "error", message: "Could not create invitation." };
  }

  revalidatePath("/invitations");
  revalidatePath("/dashboard");
  return { status: "success", message: "Invitation created." };
}

export async function updateInvitationAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = updateInvitationSchema.safeParse({
    invitationId: formData.get("invitationId"),
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
    await updateInvitation(parsed.data.invitationId, user.id, {
      name: parsed.data.name,
      email: parsed.data.email,
    });
  } catch {
    return { status: "error", message: "Could not update invitation." };
  }

  revalidatePath("/invitations");
  revalidatePath("/dashboard");
  return { status: "success", message: "Invitation updated." };
}

export async function deleteInvitationAction(invitationId: string): Promise<void> {
  const user = await requireUser();
  await deleteInvitation(invitationId, user.id);
  revalidatePath("/invitations");
  revalidatePath("/dashboard");
}

export async function addInvitationCreditAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = invitationCreditGrantSchema.safeParse({
    invitationId: formData.get("invitationId"),
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
    await createInvitationCreditGrant(
      parsed.data.invitationId,
      user.id,
      parsed.data.amount,
      parsed.data.description,
    );
  } catch {
    return { status: "error", message: "Could not add credit grant." };
  }

  revalidatePath("/invitations");
  return { status: "success", message: "Credit grant added to invitation." };
}
