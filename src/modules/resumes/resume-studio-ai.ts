import {
  resumeSuggestionSchema,
  suggestResponseSchema,
  type ResumeData,
  type ResumeSuggestion,
  type SuggestResponse,
} from "@/schemas/resume-studio";
import { extractJsonBlock, isLlmAvailableFor, llmJson } from "@/modules/ai/provider";

const STUDIO_SYSTEM_PROMPT = `You are an expert resume editor and ATS optimization assistant.

You will receive:
1. A structured resume JSON
2. An optional job description
3. A user instruction

Your job:
- Suggest improvements only — do NOT modify the resume directly.
- Do not invent fake companies, degrees, dates, or tools.
- Improve clarity, ATS alignment, impact, and specificity.
- Add metrics only if reasonable. If a metric is needed but missing, use the placeholder text "[add metric]".
- Keep tone professional and human.
- Each suggestion must target a single field. Use a fieldPath that the client can resolve.
- Allowed fieldPaths:
  - "summary"
  - "contact.fullName" | "contact.email" | "contact.phone" | "contact.location" | "contact.linkedin" | "contact.github" | "contact.portfolio"
  - "experience[<id>].title" | "experience[<id>].company" | "experience[<id>].location" | "experience[<id>].bullets[<index>]"
  - "projects[<id>].name" | "projects[<id>].description" | "projects[<id>].bullets[<index>]"
  - "education[<id>].school" | "education[<id>].degree"
  - "skills[<categoryIndex>].items"  (after must be a comma-separated list)
- targetId is the entity id when the path involves experience/projects/education.
- Return STRICT JSON, no markdown, no commentary.

Return this JSON shape exactly:

{
  "assistantMessage": "short explanation of what you changed and why",
  "suggestions": [
    {
      "id": "sug_<unique>",
      "section": "experience" | "projects" | "skills" | "education" | "summary" | "contact",
      "targetId": "<entity id or empty string>",
      "fieldPath": "<see allowed paths above>",
      "before": "<original text>",
      "after": "<improved text>",
      "reason": "<why this improves the resume>",
      "confidence": 0.0
    }
  ]
}
`;

export type SuggestInput = {
  resume: ResumeData;
  jobDescription?: string;
  userPrompt: string;
  userId?: string | null;
};

export async function generateSuggestions(input: SuggestInput): Promise<{
  ok: true;
  data: SuggestResponse;
  source: "llm" | "rule_based";
} | { ok: false; reason: string }> {
  if (await isLlmAvailableFor(input.userId)) {
    const result = await llmJson<SuggestResponse>({
      system: STUDIO_SYSTEM_PROMPT,
      user: buildPrompt(input),
      parse: (raw) => {
        const json = JSON.parse(extractJsonBlock(raw));
        return suggestResponseSchema.parse(json);
      },
      maxTokens: 2500,
      userId: input.userId,
    });
    if (result.ok) {
      const sanitized = sanitizeSuggestions(result.data, input.resume);
      return { ok: true, data: sanitized, source: "llm" };
    }
  }
  return {
    ok: true,
    data: ruleBasedSuggestions(input),
    source: "rule_based",
  };
}

function buildPrompt(input: SuggestInput): string {
  const lines = [
    "USER INSTRUCTION:",
    input.userPrompt,
    "",
    "CURRENT RESUME (JSON):",
    JSON.stringify(input.resume, null, 2),
  ];
  if (input.jobDescription && input.jobDescription.trim()) {
    lines.push("", "JOB DESCRIPTION:", input.jobDescription.slice(0, 6000));
  }
  lines.push(
    "",
    "Return only suggestions whose 'after' is genuinely better than 'before'. Aim for 3-8 high-quality suggestions, never more than 12."
  );
  return lines.join("\n");
}

function sanitizeSuggestions(
  resp: SuggestResponse,
  resume: ResumeData
): SuggestResponse {
  const seen = new Set<string>();
  const suggestions: ResumeSuggestion[] = [];
  for (const s of resp.suggestions) {
    if (!s.fieldPath) continue;
    if (s.before.trim() === s.after.trim()) continue;
    const key = `${s.fieldPath}::${s.after}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!isPathReachable(resume, s)) continue;
    const parsed = resumeSuggestionSchema.safeParse({
      ...s,
      id: s.id || `sug_${Math.random().toString(36).slice(2, 10)}`,
    });
    if (parsed.success) suggestions.push(parsed.data);
  }
  return {
    assistantMessage: resp.assistantMessage || "Here are some suggested edits.",
    suggestions,
  };
}

function isPathReachable(resume: ResumeData, s: ResumeSuggestion): boolean {
  if (s.section === "summary") return s.fieldPath === "summary";
  if (s.section === "contact") return s.fieldPath.startsWith("contact.");
  if (s.section === "experience") {
    if (!s.targetId) return false;
    return resume.experience.some((e) => e.id === s.targetId);
  }
  if (s.section === "projects") {
    if (!s.targetId) return false;
    return resume.projects.some((p) => p.id === s.targetId);
  }
  if (s.section === "education") {
    if (!s.targetId) return false;
    return resume.education.some((e) => e.id === s.targetId);
  }
  if (s.section === "skills") return s.fieldPath.startsWith("skills[");
  return false;
}

function ruleBasedSuggestions(input: SuggestInput): SuggestResponse {
  const out: ResumeSuggestion[] = [];
  let counter = 0;
  const nextId = () => `sug_rb_${++counter}`;

  const r = input.resume;

  if (r.summary && r.summary.length < 80) {
    out.push({
      id: nextId(),
      section: "summary",
      targetId: null,
      fieldPath: "summary",
      before: r.summary,
      after:
        r.summary +
        " Demonstrated impact through [add metric] across [add scope] in shipped production systems.",
      reason: "Summary is short. Adding scope and impact placeholders helps recruiters skim faster.",
      confidence: 0.6,
    });
  }

  for (const exp of r.experience) {
    exp.bullets.forEach((b, i) => {
      const lower = b.toLowerCase();
      const weakOpener = /^(worked on|helped with|responsible for|involved in|assisted)/i.test(b);
      if (weakOpener) {
        out.push({
          id: nextId(),
          section: "experience",
          targetId: exp.id,
          fieldPath: `experience[${exp.id}].bullets[${i}]`,
          before: b,
          after: b
            .replace(/^worked on\s+/i, "Built ")
            .replace(/^helped with\s+/i, "Drove ")
            .replace(/^responsible for\s+/i, "Owned ")
            .replace(/^involved in\s+/i, "Led ")
            .replace(/^assisted (with )?/i, "Partnered to ")
            .concat(", improving [add metric]."),
          reason: "Strong action verb + measurable outcome reads as more senior.",
          confidence: 0.55,
        });
      } else if (!/[0-9%]/.test(lower) && b.length > 30) {
        out.push({
          id: nextId(),
          section: "experience",
          targetId: exp.id,
          fieldPath: `experience[${exp.id}].bullets[${i}]`,
          before: b,
          after: b.replace(/[.\s]*$/, "") + ", reducing [add metric] by [add %].",
          reason: "Adding a metric anchors the impact for ATS and recruiters.",
          confidence: 0.5,
        });
      }
    });
  }

  if (input.jobDescription) {
    const jdLower = input.jobDescription.toLowerCase();
    const allSkills = r.skills.flatMap((s) => s.items);
    const lowered = new Set(allSkills.map((s) => s.toLowerCase()));
    const candidates = ["typescript", "react", "next.js", "postgresql", "aws", "docker", "kubernetes", "python", "graphql"];
    const missing = candidates.filter((c) => jdLower.includes(c) && !lowered.has(c));
    if (missing.length && r.skills.length) {
      const cat = r.skills[0];
      out.push({
        id: nextId(),
        section: "skills",
        targetId: null,
        fieldPath: `skills[0].items`,
        before: cat.items.join(", "),
        after: [...cat.items, ...missing].join(", "),
        reason: `Job description mentions ${missing.join(", ")} but they aren't on the resume.`,
        confidence: 0.7,
      });
    }
  }

  return {
    assistantMessage:
      out.length > 0
        ? "Drafted rule-based suggestions (no AI key configured). Configure a provider in Settings for stronger edits."
        : "No obvious quick wins. Configure an AI provider in Settings to unlock deeper suggestions.",
    suggestions: out,
  };
}
