import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters.")
    .max(80, "Name must be 80 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(240, "Description must be 240 characters or fewer.")
    .optional()
    .transform((value) => value || undefined),
});
