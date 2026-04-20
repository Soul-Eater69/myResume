import type { JobSignals } from "@/schemas/job-signals";
import { resumeJsonSchema, type ResumeJson } from "@/schemas/resume";
import { RESUME_SYSTEM_PROMPT } from "./prompts";
import { extractJsonBlock, isLlmAvailableFor, llmJson } from "./provider";

export type ComposerInput = {
  user: {
    name: string;
    email: string;
    headline: string | null;
    summary: string | null;
    links: { label: string; url: string }[];
    location: string | null;
    phone: string | null;
  };
  job: {
    id: string;
    company: string | null;
    title: string | null;
    signals: JobSignals;
  };
  experiences: Array<{
    id: string;
    company: string;
    title: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    bullets: string[];
  }>;
  projects: Array<{
    id: string;
    title: string;
    link: string | null;
    bullets: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string | null;
    fieldOfStudy: string | null;
    startDate: string | null;
    endDate: string | null;
  }>;
  verifiedSkills: string[];
  pageConstraint: "one_page" | "two_page";
};

export async function composeResumeDraft(
  input: ComposerInput,
  userId?: string | null
): Promise<ResumeJson> {
  if (await isLlmAvailableFor(userId)) {
    const result = await llmJson<ResumeJson>({
      system: RESUME_SYSTEM_PROMPT,
      user: buildComposerPrompt(input),
      parse: (raw) => resumeJsonSchema.parse(JSON.parse(extractJsonBlock(raw))),
      maxTokens: 3000,
      userId,
    });
    if (result.ok) return result.data;
  }
  return ruleBasedCompose(input);
}

function buildComposerPrompt(input: ComposerInput): string {
  return [
    `Target job: ${input.job.title ?? "(unspecified)"} at ${input.job.company ?? "(unspecified)"}`,
    `Job summary: ${input.job.signals.summary}`,
    `Required skills: ${input.job.signals.requiredSkills.join(", ")}`,
    `Preferred skills: ${input.job.signals.preferredSkills.join(", ")}`,
    `Keywords: ${input.job.signals.keywords.join(", ")}`,
    `Page constraint: ${input.pageConstraint}`,
    "",
    "Candidate basics:",
    JSON.stringify(input.user, null, 2),
    "",
    "Candidate verified skills:",
    input.verifiedSkills.join(", "),
    "",
    "Candidate experiences (use experienceId exactly):",
    JSON.stringify(input.experiences, null, 2),
    "",
    "Candidate projects (use projectId exactly):",
    JSON.stringify(input.projects, null, 2),
    "",
    "Candidate education (use educationId exactly):",
    JSON.stringify(input.education, null, 2),
    "",
    "Return JSON only. Use the experienceId/projectId/educationId values exactly as provided.",
  ].join("\n");
}

function ruleBasedCompose(input: ComposerInput): ResumeJson {
  const maxExp = input.pageConstraint === "one_page" ? 3 : 5;
  const maxProj = input.pageConstraint === "one_page" ? 2 : 4;
  const maxBullets = input.pageConstraint === "one_page" ? 3 : 5;

  const summary = buildRuleSummary(input);

  return resumeJsonSchema.parse({
    basics: {
      name: safeNonEmpty(input.user.name, "Unnamed"),
      headline: input.user.headline ?? null,
      email: safeEmail(input.user.email),
      phone: input.user.phone ?? null,
      location: input.user.location ?? null,
      links: sanitizeLinks(input.user.links),
    },
    summary,
    skills: dedupeOrdered([
      ...input.job.signals.requiredSkills.filter((s) =>
        input.verifiedSkills.map((x) => x.toLowerCase()).includes(s.toLowerCase())
      ),
      ...input.verifiedSkills,
    ]).slice(0, 18),
    experience: input.experiences
      .filter((e) => (e.company ?? "").trim() && (e.title ?? "").trim())
      .slice(0, maxExp)
      .map((e) => ({
        experienceId: e.id,
        company: e.company.trim(),
        title: e.title.trim(),
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        bullets: e.bullets.filter((b) => b.trim()).slice(0, maxBullets),
      })),
    projects: input.projects
      .filter((p) => (p.title ?? "").trim())
      .slice(0, maxProj)
      .map((p) => ({
        projectId: p.id,
        title: p.title.trim(),
        link: safeUrl(p.link),
        bullets: p.bullets.filter((b) => b.trim()).slice(0, maxBullets),
      })),
    education: input.education
      .filter((ed) => (ed.institution ?? "").trim())
      .map((ed) => ({
        educationId: ed.id,
        institution: ed.institution.trim(),
        degree: ed.degree,
        fieldOfStudy: ed.fieldOfStudy,
        startDate: ed.startDate,
        endDate: ed.endDate,
      })),
    warnings: [],
    suggestions: {
      projectIdeas: [],
      bulletImprovements: [],
      missingEvidence: computeMissingEvidence(input),
    },
  });
}

function safeNonEmpty(v: string | null | undefined, fallback: string): string {
  const s = (v ?? "").trim();
  return s.length ? s : fallback;
}

function safeEmail(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function safeUrl(v: string | null | undefined): string | null {
  if (!v) return null;
  try {
    // eslint-disable-next-line no-new
    new URL(v);
    return v;
  } catch {
    return null;
  }
}

function sanitizeLinks(
  links: { label: string; url: string }[]
): { label: string; url: string }[] {
  return links
    .map((l) => ({
      label: (l.label ?? "").trim(),
      url: (l.url ?? "").trim(),
    }))
    .filter((l) => l.label.length > 0 && safeUrl(l.url) !== null);
}

function buildRuleSummary(input: ComposerInput): string {
  const roleHint = input.job.title ? `for ${input.job.title}` : "";
  const matchedSkills = input.job.signals.requiredSkills
    .filter((s) =>
      input.verifiedSkills.map((x) => x.toLowerCase()).includes(s.toLowerCase())
    )
    .slice(0, 5)
    .join(", ");
  if (input.user.summary) {
    return `${input.user.summary}`.slice(0, 400);
  }
  const base =
    input.user.headline ||
    `Software engineer${roleHint ? " " + roleHint : ""}`;
  const skillTag = matchedSkills ? ` with experience in ${matchedSkills}.` : ".";
  return `${base}${skillTag}`.slice(0, 400);
}

function computeMissingEvidence(input: ComposerInput): string[] {
  const missing: string[] = [];
  const have = new Set(input.verifiedSkills.map((s) => s.toLowerCase()));
  for (const req of input.job.signals.requiredSkills) {
    if (!have.has(req.toLowerCase())) missing.push(`required skill not in profile: ${req}`);
  }
  return missing;
}

function dedupeOrdered(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const k = s.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
  }
  return out;
}
