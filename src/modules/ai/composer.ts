import type { JobSignals } from "@/schemas/job-signals";
import {
  resumeJsonSchema,
  type ResumeJson,
  type ResumeSuggestions,
} from "@/schemas/resume";
import { tokenize } from "./keywords";
import { RESUME_SYSTEM_PROMPT } from "./prompts";
import { getArchetypeFocusAreas } from "./signals";
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

type ExperienceInput = ComposerInput["experiences"][number];
type ProjectInput = ComposerInput["projects"][number];

type RankedItem<T> = {
  item: T;
  score: number;
  orderedBullets: string[];
  matchedTerms: string[];
  topBulletMoved: boolean;
  originalIndex: number;
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
  const matchedSkills = getMatchedSkills(input);
  const missingEvidence = computeMissingEvidence(input);
  const focusAreas = getArchetypeFocusAreas(input.job.signals.archetype);

  return [
    `Target job: ${input.job.title ?? "(unspecified)"} at ${input.job.company ?? "(unspecified)"}`,
    `Job summary: ${input.job.signals.summary}`,
    `Archetype: ${input.job.signals.archetype ?? "Software Engineer"}`,
    `Tailoring focus areas: ${focusAreas.join(", ") || "(none)"}`,
    `Required skills: ${input.job.signals.requiredSkills.join(", ")}`,
    `Preferred skills: ${input.job.signals.preferredSkills.join(", ")}`,
    `Keywords: ${input.job.signals.keywords.join(", ")}`,
    `Matched verified skills: ${matchedSkills.join(", ") || "(none)"}`,
    `Missing verified evidence: ${missingEvidence.join(", ") || "(none)"}`,
    `Page constraint: ${input.pageConstraint}`,
    "",
    "Guidance:",
    "- Use only the selected evidence below.",
    "- Keep uncovered requirements in suggestions.missingEvidence and suggestions.gapMitigation.",
    "- Prefer moving the strongest matching bullets earlier instead of inventing new ones.",
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

  const rankedExperiences = rankExperienceEntries(
    input.experiences,
    input.job.signals,
    maxBullets
  ).slice(0, maxExp);
  const rankedProjects = rankProjectEntries(
    input.projects,
    input.job.signals,
    maxBullets
  ).slice(0, maxProj);
  const skills = selectSkills(input);
  const summary = buildRuleSummary(input, skills);
  const suggestions = buildRuleSuggestions(input, {
    skills,
    summary,
    experiences: rankedExperiences,
    projects: rankedProjects,
  });
  const warnings = suggestions.missingEvidence.length
    ? [
        `Unverified JD gaps to review: ${suggestions.missingEvidence
          .slice(0, 4)
          .join(", ")}`,
      ]
    : [];

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
    skills,
    experience: rankedExperiences.map((entry) => ({
      experienceId: entry.item.id,
      company: entry.item.company.trim(),
      title: entry.item.title.trim(),
      location: entry.item.location,
      startDate: entry.item.startDate,
      endDate: entry.item.endDate,
      bullets: entry.orderedBullets.filter((bullet) => bullet.trim()),
    })),
    projects: rankedProjects.map((entry) => ({
      projectId: entry.item.id,
      title: entry.item.title.trim(),
      link: safeUrl(entry.item.link),
      bullets: entry.orderedBullets.filter((bullet) => bullet.trim()),
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
    warnings,
    suggestions,
  });
}

function buildRuleSummary(input: ComposerInput, selectedSkills: string[]): string {
  const matchedSkills = getMatchedSkills(input).slice(0, 4);
  const focusAreas = getArchetypeFocusAreas(input.job.signals.archetype).slice(0, 2);
  const roleHint = input.job.signals.archetype || input.job.title || "Software Engineer";
  const base = truncateSentence(
    input.user.summary ||
      input.user.headline ||
      `Software engineer aligned to ${roleHint} roles`,
    input.user.summary ? 260 : 180
  );

  const additions: string[] = [];
  if (matchedSkills.length) {
    additions.push(`Relevant strengths for this role include ${matchedSkills.join(", ")}`);
  } else if (selectedSkills.length) {
    additions.push(
      `Relevant skills for this role include ${selectedSkills.slice(0, 4).join(", ")}`
    );
  } else if (focusAreas.length) {
    additions.push(`Focus areas for this role include ${focusAreas.join(" and ")}`);
  }

  const summary = additions.length
    ? `${stripTrailingPunctuation(base)}. ${additions.join(". ")}.`
    : base;
  return truncateSentence(summary, 400);
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

function computeMissingEvidence(input: ComposerInput): string[] {
  const missing: string[] = [];
  const have = new Set(input.verifiedSkills.map((skill) => skill.toLowerCase()));
  for (const req of input.job.signals.requiredSkills) {
    if (!have.has(req.toLowerCase())) missing.push(req);
  }
  return missing;
}

function rankExperienceEntries(
  experiences: ExperienceInput[],
  signals: JobSignals,
  maxBullets: number
): RankedItem<ExperienceInput>[] {
  return experiences
    .map((item, originalIndex) => {
      const rankedBullets = rankBullets(item.bullets, signals);
      const entryText = [item.company, item.title, ...item.bullets].join(" ");
      return {
        item,
        score:
          scoreText(entryText, signals) +
          (rankedBullets[0]?.score ?? 0) * 0.35,
        orderedBullets: rankedBullets.slice(0, maxBullets).map((bullet) => bullet.text),
        matchedTerms: extractMatchedTerms(entryText, signals),
        topBulletMoved:
          (rankedBullets[0]?.index ?? 0) > 0 && (rankedBullets[0]?.score ?? 0) > 0,
        originalIndex,
      };
    })
    .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex);
}

function rankProjectEntries(
  projects: ProjectInput[],
  signals: JobSignals,
  maxBullets: number
): RankedItem<ProjectInput>[] {
  return projects
    .map((item, originalIndex) => {
      const rankedBullets = rankBullets(item.bullets, signals);
      const entryText = [item.title, ...item.bullets].join(" ");
      return {
        item,
        score:
          scoreText(entryText, signals) +
          (rankedBullets[0]?.score ?? 0) * 0.35,
        orderedBullets: rankedBullets.slice(0, maxBullets).map((bullet) => bullet.text),
        matchedTerms: extractMatchedTerms(entryText, signals),
        topBulletMoved:
          (rankedBullets[0]?.index ?? 0) > 0 && (rankedBullets[0]?.score ?? 0) > 0,
        originalIndex,
      };
    })
    .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex);
}

function rankBullets(bullets: string[], signals: JobSignals) {
  return bullets
    .map((text, index) => ({
      text,
      index,
      score: scoreText(text, signals),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
}

function selectSkills(input: ComposerInput): string[] {
  const required = new Set(input.job.signals.requiredSkills.map((skill) => skill.toLowerCase()));
  const preferred = new Set(input.job.signals.preferredSkills.map((skill) => skill.toLowerCase()));
  const priorityText = collectPriorityTerms(input.job.signals).join(" ").toLowerCase();

  return input.verifiedSkills
    .map((skill, index) => {
      const lower = skill.toLowerCase();
      let score = 0;
      if (required.has(lower)) score += 8;
      if (preferred.has(lower)) score += 5;
      if (priorityText.includes(lower)) score += 3;
      return { skill, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.skill)
    .filter((skill, index, arr) => arr.findIndex((s) => s.toLowerCase() === skill.toLowerCase()) === index)
    .slice(0, 18);
}

function buildRuleSuggestions(
  input: ComposerInput,
  opts: {
    skills: string[];
    summary: string;
    experiences: RankedItem<ExperienceInput>[];
    projects: RankedItem<ProjectInput>[];
  }
): ResumeSuggestions {
  const missingEvidence = computeMissingEvidence(input);

  return {
    projectIdeas: buildProjectIdeas(input, missingEvidence),
    bulletImprovements: buildBulletImprovements(opts.experiences, opts.projects),
    missingEvidence,
    competencyGrid: buildCompetencyGrid(opts.skills, input.job.signals),
    keywordCoverage: computeKeywordCoverage(input.job.signals, opts),
    gapMitigation: buildGapMitigation(missingEvidence, input.job.signals),
  };
}

function buildCompetencyGrid(skills: string[], signals: JobSignals): string[] {
  const required = new Set(signals.requiredSkills.map((skill) => skill.toLowerCase()));
  const preferred = new Set(signals.preferredSkills.map((skill) => skill.toLowerCase()));
  const keywordText = signals.keywords.join(" ").toLowerCase();

  return skills
    .filter((skill) => {
      const lower = skill.toLowerCase();
      return required.has(lower) || preferred.has(lower) || keywordText.includes(lower);
    })
    .slice(0, 8);
}

function computeKeywordCoverage(
  signals: JobSignals,
  opts: {
    skills: string[];
    summary: string;
    experiences: RankedItem<ExperienceInput>[];
    projects: RankedItem<ProjectInput>[];
  }
): string[] {
  const text = [
    opts.summary,
    opts.skills.join(" "),
    ...opts.experiences.map((entry) =>
      [entry.item.company, entry.item.title, ...entry.orderedBullets].join(" ")
    ),
    ...opts.projects.map((entry) =>
      [entry.item.title, ...entry.orderedBullets].join(" ")
    ),
  ].join(" ");

  const lower = text.toLowerCase();
  const tokenSet = new Set(tokenize(text));

  return collectPriorityTerms(signals)
    .filter((term) => matchesTerm(lower, tokenSet, term))
    .slice(0, 10);
}

function buildGapMitigation(missingEvidence: string[], signals: JobSignals): string[] {
  const focusAreas = getArchetypeFocusAreas(signals.archetype).slice(0, 2).join(" and ");
  return missingEvidence.slice(0, 4).map((gap) =>
    focusAreas
      ? `Address ${gap} through adjacent evidence in ${focusAreas}; keep it out of the main resume unless direct proof exists.`
      : `Treat ${gap} as a gap to discuss honestly in interviews or cover letters, not as a resume claim.`
  );
}

function buildProjectIdeas(input: ComposerInput, missingEvidence: string[]): string[] {
  const domain = input.job.signals.domainTags[0] || input.job.signals.archetype || "target role";
  return missingEvidence.slice(0, 2).map(
    (gap) =>
      `Build a small ${domain} case study that demonstrates ${gap} with one measurable outcome and a short write-up.`
  );
}

function buildBulletImprovements(
  experiences: RankedItem<ExperienceInput>[],
  projects: RankedItem<ProjectInput>[]
): string[] {
  const improvements: string[] = [];

  for (const exp of experiences.slice(0, 2)) {
    if (exp.topBulletMoved && exp.matchedTerms.length) {
      improvements.push(
        `In ${exp.item.company}, lead with the bullet that best supports ${exp.matchedTerms
          .slice(0, 2)
          .join(" and ")}.`
      );
    }
  }

  for (const project of projects.slice(0, 2)) {
    if (project.topBulletMoved && project.matchedTerms.length) {
      improvements.push(
        `In ${project.item.title}, move the strongest ${project.matchedTerms
          .slice(0, 2)
          .join(" / ")} evidence higher in the project bullets.`
      );
    }
  }

  return improvements.slice(0, 4);
}

function scoreText(text: string, signals: JobSignals): number {
  if (!text) return 0;

  const lower = text.toLowerCase();
  const tokenSet = new Set(tokenize(text));
  let score = 0;

  for (const skill of signals.requiredSkills) {
    if (matchesTerm(lower, tokenSet, skill)) score += 4;
  }

  for (const skill of signals.preferredSkills) {
    if (matchesTerm(lower, tokenSet, skill)) score += 2.5;
  }

  for (const term of getArchetypeFocusAreas(signals.archetype)) {
    if (matchesTerm(lower, tokenSet, term)) score += 2;
  }

  for (const keyword of signals.keywords.slice(0, 15)) {
    if (matchesTerm(lower, tokenSet, keyword)) score += 1.25;
  }

  for (const domain of signals.domainTags) {
    if (matchesTerm(lower, tokenSet, domain)) score += 1;
  }

  return score;
}

function extractMatchedTerms(text: string, signals: JobSignals): string[] {
  const lower = text.toLowerCase();
  const tokenSet = new Set(tokenize(text));
  return collectPriorityTerms(signals).filter((term) =>
    matchesTerm(lower, tokenSet, term)
  );
}

function collectPriorityTerms(signals: JobSignals): string[] {
  return dedupeOrdered([
    ...signals.requiredSkills,
    ...signals.preferredSkills,
    ...getArchetypeFocusAreas(signals.archetype),
    ...signals.keywords.slice(0, 12),
    ...signals.domainTags,
  ]).filter(Boolean);
}

function matchesTerm(
  lowerText: string,
  tokenSet: Set<string>,
  term: string
): boolean {
  const normalized = term.toLowerCase().trim();
  if (!normalized) return false;
  if (normalized.includes(" ")) return lowerText.includes(normalized);
  return tokenSet.has(normalized);
}

function getMatchedSkills(input: ComposerInput): string[] {
  const verified = new Set(input.verifiedSkills.map((skill) => skill.toLowerCase()));
  return dedupeOrdered([
    ...input.job.signals.requiredSkills.filter((skill) =>
      verified.has(skill.toLowerCase())
    ),
    ...input.job.signals.preferredSkills.filter((skill) =>
      verified.has(skill.toLowerCase())
    ),
  ]).slice(0, 8);
}

function stripTrailingPunctuation(text: string): string {
  return text.replace(/[.\s]+$/g, "");
}

function truncateSentence(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}.`;
}

function dedupeOrdered(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of arr) {
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}
