import { tokenize } from "./keywords";
import type { JobSignals } from "@/schemas/job-signals";

type Candidate = {
  id: string;
  text: string;
  skills: string[];
  domains: string[];
  recencyBoost?: number;
  priorityBoost?: number;
};

export type ScoredCandidate = Candidate & {
  score: number;
  reason: string;
};

function overlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b.map((x) => x.toLowerCase()));
  const hits = a.filter((x) => setB.has(x.toLowerCase())).length;
  return hits / Math.max(a.length, b.length);
}

function keywordOverlap(text: string, keywords: string[]): number {
  if (!keywords.length) return 0;
  const tokens = new Set(tokenize(text));
  const hits = keywords.filter((k) => tokens.has(k.toLowerCase())).length;
  return hits / keywords.length;
}

export function rankCandidates(
  candidates: Candidate[],
  signals: JobSignals
): ScoredCandidate[] {
  const combinedJobSkills = [
    ...signals.requiredSkills,
    ...signals.preferredSkills,
  ];
  return candidates
    .map((c) => {
      const skill = overlap(c.skills, combinedJobSkills);
      const keyword = keywordOverlap(c.text, signals.keywords);
      const domain = overlap(c.domains, signals.domainTags);
      const boost = (c.recencyBoost ?? 0) * 0.6 + (c.priorityBoost ?? 0) * 0.4;
      const score = 0.45 * skill + 0.3 * keyword + 0.15 * domain + 0.1 * boost;
      const reasons: string[] = [];
      if (skill > 0) reasons.push(`${Math.round(skill * 100)}% skill match`);
      if (keyword > 0)
        reasons.push(`${Math.round(keyword * 100)}% keyword overlap`);
      if (domain > 0) reasons.push(`${Math.round(domain * 100)}% domain fit`);
      if (boost > 0) reasons.push(`recency/priority boost`);
      return {
        ...c,
        score: clamp01(score),
        reason: reasons.join(", ") || "weak alignment",
      };
    })
    .sort((a, b) => b.score - a.score);
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function recencyFromDate(end: Date | null | undefined): number {
  if (!end) return 1; // current role
  const months =
    (Date.now() - end.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
  if (months <= 6) return 0.9;
  if (months <= 18) return 0.7;
  if (months <= 36) return 0.5;
  if (months <= 60) return 0.3;
  return 0.1;
}
