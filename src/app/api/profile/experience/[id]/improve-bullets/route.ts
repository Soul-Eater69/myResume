import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { llmJson, isLlmAvailableFor } from "@/modules/ai/provider";

export const POST = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;

  const exp = await db.experience.findFirst({
    where: { id, userId: user.id },
    include: { bullets: { orderBy: { sortOrder: "asc" } } },
  });
  if (!exp) throw notFound("experience not found");

  const rawBullets = exp.bullets.map((b) => b.bulletText).filter(Boolean);

  if (!await isLlmAvailableFor(user.id)) {
    return ok({ bullets: rawBullets, improved: false });
  }

  const role = `${exp.title} at ${exp.company}`;
  const stack = Array.isArray(exp.techStack) ? (exp.techStack as string[]).join(", ") : "";

  const result = await llmJson<{ bullets: string[] }>({
    system: `You are a resume writing expert. Rewrite experience bullets to be strong, concise, and impact-focused.
Rules:
- Start each bullet with an action verb (Led, Built, Reduced, Improved, Deployed, etc.)
- Include a measurable outcome where possible (%, time saved, scale, etc.)
- Keep each bullet to one line, max ~120 characters
- Do not invent facts — only improve wording and structure of what is given
- Return JSON only: { "bullets": ["...", "..."] }`,
    user: `Role: ${role}${stack ? `\nTech stack: ${stack}` : ""}

Original bullets:
${rawBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

Rewrite these bullets following the rules above. Return JSON only.`,
    parse: (raw) => {
      const match = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : raw);
      if (!Array.isArray(parsed.bullets)) throw new Error("invalid shape");
      return { bullets: parsed.bullets.filter((b: unknown) => typeof b === "string" && b.trim()) };
    },
    maxTokens: 800,
    userId: user.id,
  });

  if (!result.ok) {
    return ok({ bullets: rawBullets, improved: false });
  }

  return ok({ bullets: result.data.bullets, improved: true });
});
