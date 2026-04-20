import { jobSignalsSchema, type JobSignals } from "@/schemas/job-signals";
import {
  extractDomains,
  extractSkills,
  inferSeniority,
  topKeywords,
} from "./keywords";
import { extractJsonBlock, isLlmAvailableFor, llmJson } from "./provider";

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

  for (const s of skills) {
    if (!requiredSkills.has(s) && !preferredSkills.has(s)) {
      requiredSkills.add(s);
    }
  }

  const firstParagraph = jdText.trim().split(/\n{2,}/)[0] || "";
  const summary = firstParagraph.slice(0, 400);

  return jobSignalsSchema.parse({
    keywords,
    requiredSkills: Array.from(requiredSkills),
    preferredSkills: Array.from(preferredSkills).filter(
      (s) => !requiredSkills.has(s)
    ),
    domainTags: domains,
    seniority: inferSeniority(jdText),
    summary,
  });
}

function extractRequiredSection(text: string): string {
  const m = text.match(
    /(requirements|must[- ]have|what you'?ll need|qualifications)[:\s]([\s\S]{0,1500}?)(?=\n\s*\n|preferred|nice to have|what we offer|$)/i
  );
  return m ? m[2] : "";
}

function extractPreferredSection(text: string): string {
  const m = text.match(
    /(preferred|nice to have|bonus|plus)[:\s]([\s\S]{0,1500}?)(?=\n\s*\n|benefits|what we offer|$)/i
  );
  return m ? m[2] : "";
}

const SIGNAL_SYSTEM_PROMPT = `You extract structured hiring signals from job descriptions.

Output strictly this JSON shape (no prose, no markdown):
{
  "keywords": string[],
  "requiredSkills": string[],
  "preferredSkills": string[],
  "domainTags": string[],
  "seniority": "intern"|"junior"|"mid"|"senior"|"staff"|"principal"|"lead"|"unspecified",
  "summary": string
}

Rules:
- Do not invent skills not mentioned in the text.
- Keep arrays short and high-signal.
- Keep summary under 400 characters.`;
