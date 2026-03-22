"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/user";
import {
  createProjectForUser,
  deleteProjectForUser,
  toggleProjectArchivedForUser,
} from "@/lib/db/projects";
import { createProjectSchema } from "@/lib/validation/project";

export type ProjectActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: {
    name?: string[];
    description?: string[];
  };
};

export async function createProjectAction(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const user = await requireUser();

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the validation errors and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createProjectForUser(user.id, parsed.data);
  } catch (error) {
    console.error("Failed to create project", error);

    return {
      status: "error",
      message: "The project could not be created right now.",
    };
  }

  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Project created.",
  };
}

export async function toggleProjectArchivedAction(projectId: string) {
  const user = await requireUser();

  await toggleProjectArchivedForUser(projectId, user.id);
  revalidatePath("/dashboard");
}

export async function deleteProjectAction(projectId: string) {
  const user = await requireUser();

  await deleteProjectForUser(projectId, user.id);
  revalidatePath("/dashboard");
}
