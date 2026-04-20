import { z } from "zod";

const matchEntry = <K extends string>(idKey: K) =>
  z.object({
    [idKey]: z.string(),
    score: z.number().min(0).max(1),
    reason: z.string(),
  }) as z.ZodObject<{ [P in K]: z.ZodString } & { score: z.ZodNumber; reason: z.ZodString }>;

export const matchResultSchema = z.object({
  jobId: z.string(),
  experienceMatches: z.array(matchEntry("experienceId")).default([]),
  projectMatches: z.array(matchEntry("projectId")).default([]),
  repoMatches: z.array(matchEntry("repoId")).default([]),
  skillMatches: z
    .array(z.object({ skill: z.string(), score: z.number().min(0).max(1) }))
    .default([]),
});

export type MatchResult = z.infer<typeof matchResultSchema>;
