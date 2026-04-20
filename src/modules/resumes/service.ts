import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { z } from "zod";
import { resumeJsonSchema, type ResumeJson } from "@/schemas/resume";
import { composeResumeDraft, type ComposerInput } from "@/modules/ai/composer";
import { buildContext, validateGeneratedResume } from "@/modules/ai/validator";
import { renderResumeHtml } from "@/modules/exports/html";
import { computeMatches } from "@/modules/jobs/service";

export const generateSchema = z.object({
  jobId: z.string().uuid(),
  template: z.string().default("modern_one_page"),
  selectedExperienceIds: z.array(z.string().uuid()).optional(),
  selectedProjectIds: z.array(z.string().uuid()).optional(),
  selectedRepoIds: z.array(z.string().uuid()).optional(),
  pageConstraint: z.enum(["one_page", "two_page"]).default("one_page"),
  versionName: z.string().optional(),
});

export type GenerateInput = z.infer<typeof generateSchema>;

export async function generateResume(userId: string, input: GenerateInput) {
  const job = await db.job.findFirst({
    where: { id: input.jobId, userId },
    include: { signals: true },
  });
  if (!job) throw notFound("job not found");

  const matches = await computeMatches(userId, job.id);

  const experienceIds =
    input.selectedExperienceIds ??
    matches.experienceMatches.slice(0, 4).map((m) => m.experienceId);
  const projectIds =
    input.selectedProjectIds ??
    matches.projectMatches.slice(0, 3).map((m) => m.projectId);
  const repoIds =
    input.selectedRepoIds ??
    matches.repoMatches.slice(0, 2).map((m) => m.repoId);

  const [user, profile, experiences, projects, education, skills, links, repos] =
    await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.profile.findUnique({ where: { userId } }),
      db.experience.findMany({
        where: { id: { in: experienceIds }, userId },
        include: { bullets: { orderBy: { sortOrder: "asc" } } },
      }),
      db.project.findMany({
        where: { id: { in: projectIds }, userId },
        include: { bullets: { orderBy: { sortOrder: "asc" } } },
      }),
      db.education.findMany({ where: { userId } }),
      db.skill.findMany({ where: { userId, isVerified: true } }),
      db.profileLink.findMany({ where: { userId } }),
      db.githubRepo.findMany({
        where: { id: { in: repoIds }, userId },
        include: { summary: true },
      }),
    ]);
  if (!user) throw notFound("user not found");

  const composerInput: ComposerInput = {
    user: {
      name: user.name,
      email: user.email,
      headline: profile?.headline ?? null,
      summary: profile?.summary ?? null,
      links: links.map((l) => ({ label: l.label, url: l.url })),
      location: null,
      phone: null,
    },
    job: {
      id: job.id,
      company: job.company,
      title: job.title,
      signals: matches.signals,
    },
    experiences: experiences.map((e) => ({
      id: e.id,
      company: e.company,
      title: e.title,
      location: e.location,
      startDate: e.startDate ? e.startDate.toISOString().slice(0, 10) : null,
      endDate: e.endDate ? e.endDate.toISOString().slice(0, 10) : null,
      bullets: e.bullets.map((b) => b.bulletText),
    })),
    projects: [
      ...projects.map((p) => ({
        id: p.id,
        title: p.title,
        link: p.repoUrl ?? p.liveUrl ?? null,
        bullets: p.bullets.map((b) => b.bulletText),
      })),
      ...repos
        .filter((r) => r.summary)
        .map((r) => ({
          id: r.id,
          title: r.summary?.resumeReadyTitle ?? r.name,
          link: r.htmlUrl,
          bullets: toStringArray(r.summary?.resumeReadyBullets),
        })),
    ],
    education: education.map((ed) => ({
      id: ed.id,
      institution: ed.institution,
      degree: ed.degree,
      fieldOfStudy: ed.fieldOfStudy,
      startDate: ed.startDate ? ed.startDate.toISOString().slice(0, 10) : null,
      endDate: ed.endDate ? ed.endDate.toISOString().slice(0, 10) : null,
    })),
    verifiedSkills: skills.map((s) => s.name),
    pageConstraint: input.pageConstraint,
  };

  const draft = await composeResumeDraft(composerInput, userId);

  const ctx = buildContext({
    experiences: composerInput.experiences.map((e) => ({ id: e.id, company: e.company })),
    projects: composerInput.projects.map((p) => ({ id: p.id, title: p.title })),
    education: composerInput.education.map((e) => ({
      id: e.id,
      institution: e.institution,
    })),
    verifiedSkills: composerInput.verifiedSkills,
  });

  const report = validateGeneratedResume(draft, ctx);
  const finalJson: ResumeJson = resumeJsonSchema.parse({
    ...report.cleaned,
    warnings: [...report.cleaned.warnings, ...report.errors.map((e) => `rejected: ${e}`)],
  });

  const html = renderResumeHtml(finalJson);

  const resume = await db.resume.create({
    data: {
      userId,
      kind: "generated",
      title: `${job.title ?? "Resume"} — ${job.company ?? "Generated"}`,
      contentJson: finalJson,
      renderedHtml: html,
      sourceContextJson: {
        selectedExperienceIds: experienceIds,
        selectedProjectIds: projectIds,
        selectedRepoIds: repoIds,
        signals: matches.signals,
        pageConstraint: input.pageConstraint,
        template: input.template,
      },
    },
  });

  const version = await db.resumeVersion.create({
    data: {
      userId,
      jobId: job.id,
      resumeId: resume.id,
      versionName: input.versionName ?? `v${Date.now()}`,
      generationMode: "verified",
    },
  });

  await db.aiGenerationLog.create({
    data: {
      userId,
      jobId: job.id,
      operation: "compose_resume",
      modelName: process.env.ANTHROPIC_MODEL || "rule-based",
      requestPayload: { pageConstraint: input.pageConstraint, experienceIds, projectIds, repoIds },
      responsePayload: { warnings: finalJson.warnings, errors: report.errors },
      status: report.errors.length > 0 ? "warn" : "ok",
    },
  });

  return {
    resumeId: resume.id,
    resumeVersionId: version.id,
    resume: finalJson,
    previewHtml: html,
    warnings: finalJson.warnings,
    errors: report.errors,
  };
}

export async function getResume(userId: string, id: string) {
  const resume = await db.resume.findFirst({ where: { id, userId } });
  if (!resume) throw notFound("resume not found");
  return resume;
}

export async function listVersionsForJob(userId: string, jobId: string) {
  return db.resumeVersion.findMany({
    where: { userId, jobId },
    orderBy: { createdAt: "desc" },
    include: { resume: true },
  });
}

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}
