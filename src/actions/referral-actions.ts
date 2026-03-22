"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/user";
import { createReferralCode, deleteReferralCode } from "@/lib/db/referral-codes";

export async function createReferralCodeAction(): Promise<void> {
  const user = await requireUser();
  await createReferralCode(user.id);
  revalidatePath("/referrals");
}

export async function deleteReferralCodeAction(codeId: string): Promise<void> {
  const user = await requireUser();
  await deleteReferralCode(codeId, user.id);
  revalidatePath("/referrals");
}
