import { z } from "zod";

export const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const resumeBasicsSchema = z.object({
  name: z.string().min(1),
  headline: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  links: z.array(linkSchema).default([]),
});

export const resumeExperienceSchema = z.object({
  experienceId: z.string().uuid().optional(),
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  bullets: z.array(z.string()).default([]),
});

export const resumeProjectSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(1),
  link: z.string().url().optional().nullable(),
  bullets: z.array(z.string()).default([]),
});

export const resumeEducationSchema = z.object({
  educationId: z.string().uuid().optional(),
  institution: z.string().min(1),
  degree: z.string().optional().nullable(),
  fieldOfStudy: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const resumeJsonSchema = z.object({
  basics: resumeBasicsSchema,
  summary: z.string().default(""),
  skills: z.array(z.string()).default([]),
  experience: z.array(resumeExperienceSchema).default([]),
  projects: z.array(resumeProjectSchema).default([]),
  education: z.array(resumeEducationSchema).default([]),
  warnings: z.array(z.string()).default([]),
  suggestions: z
    .object({
      projectIdeas: z.array(z.string()).default([]),
      bulletImprovements: z.array(z.string()).default([]),
      missingEvidence: z.array(z.string()).default([]),
    })
    .default({ projectIdeas: [], bulletImprovements: [], missingEvidence: [] }),
});

export type ResumeJson = z.infer<typeof resumeJsonSchema>;
export type ResumeExperience = z.infer<typeof resumeExperienceSchema>;
export type ResumeProject = z.infer<typeof resumeProjectSchema>;
