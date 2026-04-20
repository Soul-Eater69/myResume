import { z } from "zod";

export const jobInputSchema = z.object({
  company: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  jdText: z.string().min(10),
  location: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
});

export const jobStatusSchema = z.enum([
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "archived",
]);

export const jobPatchSchema = z.object({
  company: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  status: jobStatusSchema.optional(),
});

export type JobInput = z.infer<typeof jobInputSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type JobPatch = z.infer<typeof jobPatchSchema>;
