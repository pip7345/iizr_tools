"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/user";
import {
  createCreditNomination,
  spendCredits,
} from "@/lib/db/credits";
import { isInDownline } from "@/lib/db/users";
import { creditNominationSchema, spendCreditsSchema } from "@/lib/validation/schemas";

import type { ActionState } from "@/actions/user-actions";

export async function nominateCreditAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = creditNominationSchema.safeParse({
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

  // Verify target is in downline
  const inDownline = await isInDownline(user.id, parsed.data.userId);
  if (!inDownline) {
    return { status: "error", message: "You can only nominate credits for users in your downline." };
  }

  try {
    await createCreditNomination(
      user.id,
      parsed.data.userId,
      parsed.data.amount,
      parsed.data.description,
    );
  } catch {
    return { status: "error", message: "Could not create nomination." };
  }

  revalidatePath("/credits");
  return { status: "success", message: "Credit nomination submitted for approval." };
}

export async function spendCreditsAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = spendCreditsSchema.safeParse({
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
    await spendCredits(user.id, parsed.data.amount, parsed.data.description);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not spend credits.",
    };
  }

  revalidatePath("/credits");
  return { status: "success", message: "Credits spent." };
}
