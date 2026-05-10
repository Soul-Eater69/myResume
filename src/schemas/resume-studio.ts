import { z } from "zod";

export const studioContactSchema = z.object({
  fullName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  linkedin: z.string().default(""),
  github: z.string().default(""),
  portfolio: z.string().default(""),
});

export const studioExperienceSchema = z.object({
  id: z.string(),
  company: z.string().default(""),
  title: z.string().default(""),
  location: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});

export const studioProjectSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  description: z.string().default(""),
  techStack: z.array(z.string()).default([]),
  bullets: z.array(z.string()).default([]),
  links: z.array(z.string()).default([]),
});

export const studioEducationSchema = z.object({
  id: z.string(),
  school: z.string().default(""),
  degree: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  location: z.string().default(""),
});

export const studioSkillGroupSchema = z.object({
  category: z.string().default(""),
  items: z.array(z.string()).default([]),
});

export const resumeDataSchema = z.object({
  contact: studioContactSchema.default({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  }),
  summary: z.string().default(""),
  experience: z.array(studioExperienceSchema).default([]),
  projects: z.array(studioProjectSchema).default([]),
  education: z.array(studioEducationSchema).default([]),
  skills: z.array(studioSkillGroupSchema).default([]),
});

export type ResumeData = z.infer<typeof resumeDataSchema>;
export type StudioExperience = z.infer<typeof studioExperienceSchema>;
export type StudioProject = z.infer<typeof studioProjectSchema>;
export type StudioEducation = z.infer<typeof studioEducationSchema>;
export type StudioSkillGroup = z.infer<typeof studioSkillGroupSchema>;
export type StudioContact = z.infer<typeof studioContactSchema>;

export const suggestionSectionSchema = z.enum([
  "summary",
  "experience",
  "projects",
  "skills",
  "education",
  "contact",
]);

export const resumeSuggestionSchema = z.object({
  id: z.string(),
  section: suggestionSectionSchema,
  targetId: z.string().optional().nullable(),
  fieldPath: z.string(),
  before: z.string().default(""),
  after: z.string().default(""),
  reason: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type ResumeSuggestion = z.infer<typeof resumeSuggestionSchema>;

export const suggestResponseSchema = z.object({
  assistantMessage: z.string().default(""),
  suggestions: z.array(resumeSuggestionSchema).default([]),
});

export type SuggestResponse = z.infer<typeof suggestResponseSchema>;

export const suggestRequestSchema = z.object({
  resumeId: z.string().uuid(),
  resume: resumeDataSchema,
  jobDescription: z.string().optional(),
  userPrompt: z.string().min(1),
});

export const saveRequestSchema = z.object({
  resumeId: z.string().uuid(),
  resume: resumeDataSchema,
  versionName: z.string().optional(),
  saveAsNewVersion: z.boolean().optional().default(false),
});

export function emptyResumeData(seed?: { name?: string | null; email?: string | null }): ResumeData {
  return {
    contact: {
      fullName: seed?.name ?? "",
      email: seed?.email ?? "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
    },
    summary: "",
    experience: [],
    projects: [],
    education: [],
    skills: [],
  };
}
