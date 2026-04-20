import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import type { JobInput, JobPatch } from "@/schemas/job";
import { extractJobSignals } from "@/modules/ai/signals";
import { rankCandidates, recencyFromDate } from "@/modules/ai/ranking";
import { jobSignalsSchema, type JobSignals } from "@/schemas/job-signals";

export async function listJobs(userId: string) {
  return db.job.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { signals: true },
  });
}

export async function createJob(userId: string, input: JobInput) {
  const job = await db.job.create({
    data: {
      userId,
      company: input.company ?? null,
      title: input.title ?? null,
      sourceUrl: input.sourceUrl ?? null,
      jdText: input.jdText,
      location: input.location ?? null,
      employmentType: input.employmentType ?? null,
    },
  });
  await runExtraction(job.id).catch(() => {});
  return job;
}

export async function getJob(userId: string, id: string) {
  const job = await db.job.findFirst({
    where: { id, userId },
    include: { signals: true },
  });
  if (!job) throw notFound("job not found");
  return job;
}

export async function patchJob(userId: string, id: string, input: JobPatch) {
  const existing = await db.job.findFirst({ where: { id, userId } });
  if (!existing) throw notFound("job not found");
  return db.job.update({
    where: { id },
    data: {
      company: input.company ?? undefined,
      title: input.title ?? undefined,
      sourceUrl: input.sourceUrl ?? undefined,
      location: input.location ?? undefined,
      employmentType: input.employmentType ?? undefined,
      status: input.status ?? undefined,
    },
  });
}

export async function deleteJob(userId: string, id: string) {
  const res = await db.job.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw notFound("job not found");
}

export async function runExtraction(jobId: string): Promise<JobSignals> {
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job) throw notFound("job not found");
  const signals = await extractJobSignals(job.jdText, job.userId);
  await db.jobSignal.upsert({
    where: { jobId },
    create: {
      jobId,
      keywords: signals.keywords,
      requiredSkills: signals.requiredSkills,
      preferredSkills: signals.preferredSkills,
      domainTags: signals.domainTags,
      seniority: signals.seniority,
      summary: signals.summary,
    },
    update: {
      keywords: signals.keywords,
      requiredSkills: signals.requiredSkills,
      preferredSkills: signals.preferredSkills,
      domainTags: signals.domainTags,
      seniority: signals.seniority,
      summary: signals.summary,
    },
  });
  return signals;
}

export async function computeMatches(userId: string, jobId: string) {
  const job = await db.job.findFirst({
    where: { id: jobId, userId },
    include: { signals: true },
  });
  if (!job) throw notFound("job not found");

  let signals: JobSignals;
  if (!job.signals) {
    signals = await runExtraction(job.id);
  } else {
    signals = jobSignalsSchema.parse({
      keywords: job.signals.keywords ?? [],
      requiredSkills: job.signals.requiredSkills ?? [],
      preferredSkills: job.signals.preferredSkills ?? [],
      domainTags: job.signals.domainTags ?? [],
      seniority: job.signals.seniority ?? "unspecified",
      summary: job.signals.summary ?? "",
    });
  }

  const [experiences, projects, repos, skills] = await Promise.all([
    db.experience.findMany({
      where: { userId },
      include: { bullets: { orderBy: { sortOrder: "asc" } } },
    }),
    db.project.findMany({
      where: { userId },
      include: { bullets: { orderBy: { sortOrder: "asc" } } },
    }),
    db.githubRepo.findMany({
      where: { userId },
      include: { summary: true },
    }),
    db.skill.findMany({ where: { userId } }),
  ]);

  const expCandidates = experiences.map((e) => ({
    id: e.id,
    text: [e.company, e.title, e.description ?? "", e.bullets.map((b) => b.bulletText).join(" ")].join(" "),
    skills: jsonStrings(e.techStack),
    domains: jsonStrings(e.domainTags),
    recencyBoost: recencyFromDate(e.endDate),
  }));
  const projCandidates = projects.map((p) => ({
    id: p.id,
    text: [p.title, p.description ?? "", p.bullets.map((b) => b.bulletText).join(" ")].join(" "),
    skills: jsonStrings(p.techStack),
    domains: jsonStrings(p.domainTags),
  }));
  const repoCandidates = repos.map((r) => ({
    id: r.id,
    text: [r.name, r.description ?? "", r.summary?.summary ?? ""].join(" "),
    skills: jsonStrings(r.languages),
    domains: jsonStrings(r.topics).concat(jsonStrings(r.summary?.roleTags ?? null)),
    recencyBoost: recencyFromDate(r.lastPushedAt),
  }));

  const rankedExp = rankCandidates(expCandidates, signals).slice(0, 8);
  const rankedProj = rankCandidates(projCandidates, signals).slice(0, 6);
  const rankedRepo = rankCandidates(repoCandidates, signals).slice(0, 6);

  const skillScores = skills.map((s) => ({
    skill: s.name,
    score: signals.requiredSkills.map((x) => x.toLowerCase()).includes(s.name.toLowerCase())
      ? 1
      : signals.preferredSkills.map((x) => x.toLowerCase()).includes(s.name.toLowerCase())
      ? 0.7
      : 0,
  }));

  return {
    jobId,
    signals,
    experienceMatches: rankedExp.map((r) => ({
      experienceId: r.id,
      score: r.score,
      reason: r.reason,
    })),
    projectMatches: rankedProj.map((r) => ({
      projectId: r.id,
      score: r.score,
      reason: r.reason,
    })),
    repoMatches: rankedRepo.map((r) => ({
      repoId: r.id,
      score: r.score,
      reason: r.reason,
    })),
    skillMatches: skillScores.filter((s) => s.score > 0).sort((a, b) => b.score - a.score),
  };
}

function jsonStrings(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}
