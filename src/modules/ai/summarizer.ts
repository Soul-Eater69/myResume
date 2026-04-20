import { REPO_SUMMARY_SYSTEM_PROMPT } from "./prompts";
import { extractJsonBlock, isLlmAvailableFor, llmJson } from "./provider";
import { extractSkills } from "./keywords";

export type RepoSummaryDraft = {
  summary: string;
  resumeReadyTitle: string;
  resumeReadyBullets: string[];
  techTags: string[];
  roleTags: string[];
  confidenceScores: {
    ownership: number;
    scope: number;
    claimSupport: number;
  };
};

export type RepoSummaryResult = {
  draft: RepoSummaryDraft;
  source: "llm" | "rule_based";
};

export async function summarizeRepo(
  input: {
    name: string;
    description: string | null;
    languages: string[];
    topics: string[];
    readmeText: string | null;
    stars: number;
  },
  userId?: string | null
): Promise<RepoSummaryResult> {
  if (await isLlmAvailableFor(userId)) {
    const result = await llmJson<RepoSummaryDraft>({
      system: REPO_SUMMARY_SYSTEM_PROMPT,
      user: buildRepoPrompt(input),
      parse: (raw) => JSON.parse(extractJsonBlock(raw)) as RepoSummaryDraft,
      maxTokens: 1400,
      userId,
    });
    if (result.ok) return { draft: result.data, source: "llm" };
  }
  return { draft: ruleBasedSummary(input), source: "rule_based" };
}

function buildRepoPrompt(input: {
  name: string;
  description: string | null;
  languages: string[];
  topics: string[];
  readmeText: string | null;
  stars: number;
}): string {
  return [
    `Repo: ${input.name}`,
    `Description: ${input.description ?? ""}`,
    `Languages: ${input.languages.join(", ")}`,
    `Topics: ${input.topics.join(", ")}`,
    `Stars: ${input.stars}`,
    "",
    "README:",
    (input.readmeText || "").slice(0, 8000),
  ].join("\n");
}

function ruleBasedSummary(input: {
  name: string;
  description: string | null;
  languages: string[];
  topics: string[];
  readmeText: string | null;
  stars: number;
}): RepoSummaryDraft {
  const corpus = [input.description ?? "", input.readmeText ?? ""].join("\n");
  const techTags = Array.from(
    new Set([
      ...input.languages.map((l) => l.toLowerCase()),
      ...extractSkills(corpus),
    ])
  );
  const role = inferRoleTag(techTags);
  const summary =
    (input.description ||
      firstParagraph(input.readmeText) ||
      `Repository ${input.name}`).slice(0, 400);
  return {
    summary,
    resumeReadyTitle: toTitle(input.name),
    resumeReadyBullets: buildDraftBullets(input.name, techTags, input.readmeText),
    techTags: techTags.slice(0, 12),
    roleTags: role,
    confidenceScores: {
      ownership: input.readmeText ? 0.5 : 0.3,
      scope: clamp01(input.stars / 100),
      claimSupport: input.readmeText ? 0.4 : 0.2,
    },
  };
}

function firstParagraph(text: string | null) {
  if (!text) return "";
  return (text.split(/\n{2,}/)[0] || "").slice(0, 400);
}

function toTitle(name: string) {
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildDraftBullets(name: string, tech: string[], readme: string | null): string[] {
  const primary = tech.slice(0, 4).join(", ");
  const intro = `Built ${toTitle(name)}${primary ? ` using ${primary}` : ""} — draft, review required.`;
  if (!readme) return [intro];
  // extract the first two bullet-style lines from readme, if any
  const lines = readme.split(/\r?\n/).map((l) => l.trim());
  const extra = lines
    .filter((l) => /^[-*•]\s+/.test(l))
    .slice(0, 2)
    .map((l) => l.replace(/^[-*•]\s+/, "").replace(/\s+/g, " ").slice(0, 220) + " (from README — verify)");
  return [intro, ...extra];
}

function inferRoleTag(tech: string[]): string[] {
  const tags = new Set<string>();
  const has = (x: string) => tech.includes(x);
  if (has("react") || has("next.js") || has("vue") || has("angular")) tags.add("frontend");
  if (has("node") || has("express") || has("fastapi") || has("django") || has("flask") || has("nestjs") || has("spring"))
    tags.add("backend");
  if (has("pytorch") || has("tensorflow") || has("huggingface") || has("ml") || has("ai"))
    tags.add("ml");
  if (has("rag") || has("llm") || has("langchain") || has("embeddings")) tags.add("llm");
  if (has("kubernetes") || has("terraform") || has("docker") || has("aws") || has("gcp"))
    tags.add("infra");
  if (has("airflow") || has("dbt") || has("spark") || has("bigquery")) tags.add("data");
  return Array.from(tags);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
