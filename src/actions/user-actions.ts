"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/user";
import { updateUserProfile, selfAssignSponsor } from "@/lib/db/users";
import { updateProfileSchema } from "@/lib/validation/schemas";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[]>;
};

export async function updateProfileAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = updateProfileSchema.safeParse({
    preferredDisplayName: formData.get("preferredDisplayName") || undefined,
    bio: formData.get("bio") || undefined,
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the validation errors.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await updateUserProfile(user.id, parsed.data);
  } catch {
    return { status: "error", message: "Could not update profile." };
  }

  revalidatePath("/profile");
  return { status: "success", message: "Profile updated." };
}

export async function selfAssignSponsorAction(sponsorId: string): Promise<ActionState> {
  const user = await requireUser();

  try {
    await selfAssignSponsor(user.id, sponsorId);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not assign sponsor.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/sponsor");
  return { status: "success", message: "Sponsor assigned." };
}
