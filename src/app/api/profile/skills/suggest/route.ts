import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { llmJson, isLlmAvailableFor } from "@/modules/ai/provider";

export const POST = handle(async (_req) => {
  const user = await requireUser();

  const skills = await db.skill.findMany({
    where: { userId: user.id, isVerified: true },
    select: { name: true, category: true },
  });

  if (!await isLlmAvailableFor(user.id)) {
    return ok({ suggestions: [], improved: false });
  }

  if (skills.length === 0) {
    return ok({ suggestions: [], improved: false });
  }

  const grouped = skills.reduce<Record<string, string[]>>((acc, s) => {
    const key = s.category || "other";
    (acc[key] ||= []).push(s.name);
    return acc;
  }, {});

  const skillSummary = Object.entries(grouped)
    .map(([cat, names]) => `${cat}: ${names.join(", ")}`)
    .join("\n");

  const result = await llmJson<{ suggestions: { name: string; category: string }[] }>({
    system: `You are a technical resume expert. Given a software engineer's verified skill set, suggest additional skills they likely have but haven't listed yet.

Rules:
- Only suggest skills that are genuinely implied by or adjacent to what they already have
- Do NOT suggest skills that are already listed
- Assign each suggestion to the most appropriate category (language, framework, cloud, tool, database, concept, etc.)
- Return 5–10 high-confidence suggestions only — quality over quantity
- Return JSON only: { "suggestions": [{ "name": "...", "category": "..." }] }`,
    user: `Current verified skills:
${skillSummary}

Suggest additional skills this engineer likely has. Return JSON only.`,
    parse: (raw) => {
      const match = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : raw);
      if (!Array.isArray(parsed.suggestions)) throw new Error("invalid shape");
      return {
        suggestions: parsed.suggestions.filter(
          (s: unknown) =>
            s &&
            typeof s === "object" &&
            typeof (s as { name?: unknown }).name === "string" &&
            (s as { name: string }).name.trim()
        ),
      };
    },
    maxTokens: 600,
    userId: user.id,
  });

  if (!result.ok) {
    return ok({ suggestions: [], improved: false });
  }

  const existing = new Set(skills.map((s) => s.name.toLowerCase()));
  const filtered = result.data.suggestions.filter(
    (s) => !existing.has(s.name.toLowerCase())
  );

  return ok({ suggestions: filtered, improved: true });
});
