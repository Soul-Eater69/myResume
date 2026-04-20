import { z } from "zod";

export const applicationStatusSchema = z.enum([
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
]);

export const applicationInputSchema = z.object({
  jobId: z.string().uuid(),
  resumeVersionId: z.string().uuid().optional().nullable(),
  status: applicationStatusSchema.optional(),
  appliedAt: z.string().datetime().optional().nullable(),
  followUpAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const applicationPatchSchema = applicationInputSchema.partial().omit({ jobId: true });

export type ApplicationInput = z.infer<typeof applicationInputSchema>;
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
