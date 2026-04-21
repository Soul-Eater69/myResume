import { jobSignalsSchema, type JobSignals } from "@/schemas/job-signals";
import {
  extractDomains,
  extractSkills,
  inferSeniority,
  topKeywords,
} from "./keywords";
import { extractJsonBlock, isLlmAvailableFor, llmJson } from "./provider";

type ArchetypeRule = {
  label: string;
  patterns: RegExp[];
  focusAreas: string[];
};

const DEFAULT_ARCHETYPE = "Software Engineer";
const DEFAULT_FOCUS_AREAS = ["delivery", "systems design", "execution"];

const ARCHETYPE_RULES: ArchetypeRule[] = [
  {
    label: "AI Platform / LLMOps Engineer",
    patterns: [
      /\bai platform\b/i,
      /\bllmops\b/i,
      /\bmlops\b/i,
      /\bobservability\b/i,
      /\bevals?\b/i,
      /\bmodel monitoring\b/i,
      /\breliability\b/i,
      /\bai infrastructure\b/i,
      /\bpipelines?\b/i,
      /\bprompt management\b/i,
    ],
    focusAreas: ["evals", "observability", "reliability", "pipelines"],
  },
  {
    label: "Agentic Workflows / Automation Engineer",
    patterns: [
      /\bagentic\b/i,
      /\bagents?\b/i,
      /\btool calling\b/i,
      /\borchestration\b/i,
      /\bworkflow automation\b/i,
      /\bhitl\b/i,
      /\bhuman[- ]in[- ]the[- ]loop\b/i,
      /\bautomation\b/i,
    ],
    focusAreas: ["agents", "orchestration", "HITL", "automation"],
  },
  {
    label: "Technical AI Product Manager",
    patterns: [
      /\bproduct manager\b/i,
      /\btechnical product manager\b/i,
      /\bai pm\b/i,
      /\broadmap\b/i,
      /\bprd\b/i,
      /\bproduct discovery\b/i,
      /\bstakeholder\b/i,
      /\bgo-to-market\b/i,
      /\bmetrics\b/i,
    ],
    focusAreas: ["discovery", "roadmaps", "stakeholder alignment", "metrics"],
  },
  {
    label: "AI Solutions Architect",
    patterns: [
      /\bsolutions? architect\b/i,
      /\benterprise architect\b/i,
      /\bsolution design\b/i,
      /\bintegrations?\b/i,
      /\barchitecture\b/i,
      /\benterprise\b/i,
      /\bpre[- ]sales\b/i,
    ],
    focusAreas: ["system design", "integrations", "enterprise architecture"],
  },
  {
    label: "AI Forward Deployed Engineer",
    patterns: [
      /\bforward deployed\b/i,
      /\bfield engineer\b/i,
      /\bcustomer engineer\b/i,
      /\bimplementation\b/i,
      /\bclient[- ]facing\b/i,
      /\bcustomer[- ]facing\b/i,
      /\bpilot\b/i,
      /\bprototype\b/i,
      /\bdeployment\b/i,
    ],
    focusAreas: ["client delivery", "rapid prototyping", "deployment"],
  },
  {
    label: "AI Transformation Lead",
    patterns: [
      /\btransformation\b/i,
      /\bchange management\b/i,
      /\badoption\b/i,
      /\benablement\b/i,
      /\boperating model\b/i,
      /\bai strategy\b/i,
      /\btraining\b/i,
    ],
    focusAreas: ["change management", "adoption", "enablement"],
  },
];

const ARCHETYPE_FOCUS_AREAS = new Map(
  ARCHETYPE_RULES.map((rule) => [rule.label, rule.focusAreas] as const)
);

export async function extractJobSignals(
  jdText: string,
  userId?: string | null
): Promise<JobSignals> {
  if (await isLlmAvailableFor(userId)) {
    const result = await llmJson<JobSignals>({
      system: SIGNAL_SYSTEM_PROMPT,
      user: `Job description:\n\n${jdText}\n\nReturn JSON only.`,
      parse: (raw) => jobSignalsSchema.parse(JSON.parse(extractJsonBlock(raw))),
      maxTokens: 1200,
      userId,
    });
    if (result.ok) return result.data;
  }
  return ruleBasedSignals(jdText);
}

export function ruleBasedSignals(jdText: string): JobSignals {
  const skills = extractSkills(jdText);
  const domains = extractDomains(jdText);
  const keywords = topKeywords(jdText, 25);
  const required = extractRequiredSection(jdText);
  const preferred = extractPreferredSection(jdText);
  const requiredSkills = new Set(extractSkills(required));
  const preferredSkills = new Set(extractSkills(preferred));

  for (const skill of skills) {
    if (!requiredSkills.has(skill) && !preferredSkills.has(skill)) {
      requiredSkills.add(skill);
    }
  }

  const firstParagraph = jdText.trim().split(/\n{2,}/)[0] || "";
  const summary = firstParagraph.slice(0, 400);

  return jobSignalsSchema.parse({
    keywords,
    requiredSkills: Array.from(requiredSkills),
    preferredSkills: Array.from(preferredSkills).filter(
      (skill) => !requiredSkills.has(skill)
    ),
    domainTags: domains,
    seniority: inferSeniority(jdText),
    summary,
    archetype: inferArchetype(jdText),
  });
}

function extractRequiredSection(text: string): string {
  const match = text.match(
    /(requirements|must[- ]have|what you'?ll need|qualifications)[:\s]([\s\S]{0,1500}?)(?=\n\s*\n|preferred|nice to have|what we offer|$)/i
  );
  return match ? match[2] : "";
}

function extractPreferredSection(text: string): string {
  const match = text.match(
    /(preferred|nice to have|bonus|plus)[:\s]([\s\S]{0,1500}?)(?=\n\s*\n|benefits|what we offer|$)/i
  );
  return match ? match[2] : "";
}

export function inferArchetype(jdText: string): string {
  const lower = jdText.toLowerCase();

  if (/\b(research scientist|applied scientist|research engineer)\b/.test(lower)) {
    return "AI Research Scientist";
  }
  if (
    /\b(data engineer|analytics engineer|data platform|etl|data warehouse|warehousing)\b/.test(
      lower
    )
  ) {
    return "Data Engineer";
  }

  let bestLabel = DEFAULT_ARCHETYPE;
  let bestScore = 0;

  for (const rule of ARCHETYPE_RULES) {
    const score = rule.patterns.reduce(
      (sum, pattern) => sum + (pattern.test(lower) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestLabel = rule.label;
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestLabel : DEFAULT_ARCHETYPE;
}

export function getArchetypeFocusAreas(archetype?: string | null): string[] {
  if (!archetype) return DEFAULT_FOCUS_AREAS;

  const exact = ARCHETYPE_FOCUS_AREAS.get(archetype);
  if (exact) return exact;

  const lower = archetype.toLowerCase();
  if (lower.includes("product")) {
    return ["discovery", "roadmaps", "stakeholder alignment", "metrics"];
  }
  if (lower.includes("architect")) {
    return ["system design", "integrations", "enterprise architecture"];
  }
  if (lower.includes("deployed") || lower.includes("field")) {
    return ["client delivery", "rapid prototyping", "deployment"];
  }
  if (lower.includes("data")) {
    return ["data pipelines", "warehousing", "reliability"];
  }
  if (lower.includes("research")) {
    return ["experimentation", "model quality", "applied research"];
  }
  return DEFAULT_FOCUS_AREAS;
}

const SIGNAL_SYSTEM_PROMPT = `You extract structured hiring signals from job descriptions.

Output strictly this JSON shape (no prose, no markdown):
{
  "keywords": string[],
  "requiredSkills": string[],
  "preferredSkills": string[],
  "domainTags": string[],
  "seniority": "intern"|"junior"|"mid"|"senior"|"staff"|"principal"|"lead"|"unspecified",
  "summary": string,
  "archetype": string
}

Rules:
- Do not invent skills not mentioned in the text.
- Keep arrays short and high-signal.
- Keep summary under 400 characters.
- Archetype: Classify the role into the best-fit label from this list when possible: "AI Platform / LLMOps Engineer", "Agentic Workflows / Automation Engineer", "Technical AI Product Manager", "AI Solutions Architect", "AI Forward Deployed Engineer", "AI Transformation Lead", "AI Research Scientist", "Data Engineer", or "Software Engineer".
- Favor the role's actual focus over generic title words. For example, "client-facing implementation" leans forward deployed, and "observability/evals/reliability" leans AI Platform / LLMOps.`;
