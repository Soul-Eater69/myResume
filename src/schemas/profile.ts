import { z } from "zod";

export const profileUpdateSchema = z.object({
  headline: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  targetRoles: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  yearsOfExperience: z.number().nonnegative().optional(),
});

export const experienceInputSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().optional(),
  description: z.string().optional().nullable(),
  techStack: z.array(z.string()).optional(),
  domainTags: z.array(z.string()).optional(),
  bullets: z.array(z.string()).default([]),
});

export const projectInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  repoUrl: z.string().url().optional().nullable(),
  liveUrl: z.string().url().optional().nullable(),
  techStack: z.array(z.string()).optional(),
  domainTags: z.array(z.string()).optional(),
  bullets: z.array(z.string()).default([]),
  isVerified: z.boolean().optional(),
});

export const skillInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional().nullable(),
  proficiency: z.string().optional().nullable(),
});

export const educationInputSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().optional().nullable(),
  fieldOfStudy: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  gpa: z.string().optional().nullable(),
});

export const certificationInputSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  credentialUrl: z.string().url().optional().nullable(),
});

export const profileLinkInputSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ExperienceInput = z.infer<typeof experienceInputSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type SkillInput = z.infer<typeof skillInputSchema>;
export type EducationInput = z.infer<typeof educationInputSchema>;
export type CertificationInput = z.infer<typeof certificationInputSchema>;
export type ProfileLinkInput = z.infer<typeof profileLinkInputSchema>;
