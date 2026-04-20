import { z } from "zod";

export const jobSignalsSchema = z.object({
  keywords: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  domainTags: z.array(z.string()).default([]),
  seniority: z
    .enum(["intern", "junior", "mid", "senior", "staff", "principal", "lead", "unspecified"])
    .default("unspecified"),
  summary: z.string().default(""),
});

export type JobSignals = z.infer<typeof jobSignalsSchema>;
