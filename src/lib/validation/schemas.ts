import { z } from "zod";

export const updateProfileSchema = z.object({
  preferredDisplayName: z.string().max(80).trim().optional(),
  bio: z.string().max(500).trim().optional(),
  location: z.string().max(120).trim().optional(),
});

export const invitationSchema = z.object({
  name: z.string().min(1, "Name is required").max(120).trim(),
  email: z.email("Invalid email address").optional().or(z.literal("")),
});

export const creditNominationSchema = z.object({
  userId: z.string().min(1, "User is required"),
  amount: z.coerce.number().int().positive("Amount must be a positive integer"),
  description: z.string().min(1, "Description is required").max(500).trim(),
});

export const spendCreditsSchema = z.object({
  amount: z.coerce.number().int().positive("Amount must be a positive integer"),
  description: z.string().min(1, "Description is required").max(500).trim(),
});

export const adminCreditSchema = z.object({
  userId: z.string().min(1, "User is required"),
  amount: z.coerce.number().int().refine((n) => n !== 0, "Amount cannot be zero"),
  description: z.string().min(1, "Description is required").max(500).trim(),
});

export const adminUpdateCreditSchema = z.object({
  transactionId: z.string().min(1, "Transaction is required"),
  amount: z.coerce.number().int().refine((n) => n !== 0, "Amount cannot be zero"),
  description: z.string().min(1, "Description is required").max(500).trim(),
});

export const rejectionReasonSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required").max(500).trim(),
});

export const invitationCreditGrantSchema = z.object({
  invitationId: z.string().min(1),
  amount: z.coerce.number().int().positive("Amount must be a positive integer"),
  description: z.string().min(1, "Description is required").max(500).trim(),
});

export const updateInvitationSchema = z.object({
  invitationId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(120).trim(),
  email: z.email("Invalid email address").optional().or(z.literal("")),
});
