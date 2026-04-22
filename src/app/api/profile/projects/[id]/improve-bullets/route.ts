import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { llmJson, isLlmAvailableFor } from "@/modules/ai/provider";

export const POST = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    include: { bullets: { orderBy: { sortOrder: "asc" } } },
  });
  if (!project) throw notFound("project not found");

  const rawBullets = project.bullets.map((b) => b.bulletText).filter(Boolean);

  if (!await isLlmAvailableFor(user.id)) {
    return ok({ bullets: rawBullets, improved: false });
  }

  const stack = Array.isArray(project.techStack)
    ? (project.techStack as string[]).join(", ")
    : "";

  const result = await llmJson<{ bullets: string[] }>({
    system: `You are a resume writing expert specialising in project descriptions for software engineers.
Rewrite the provided project bullets so they are compelling, concrete, and recruiter-ready.

Rules:
- Begin every bullet with a strong past-tense action verb (Built, Designed, Reduced, Shipped, Automated, etc.)
- Include at least one concrete detail per bullet: a metric, a scale, a technology, or a specific outcome
- Each bullet must fit on one line — aim for 100–130 characters
- Do NOT invent facts. Reword and sharpen only what is already stated
- Remove vague filler phrases ("worked on", "helped with", "was responsible for")
- Return JSON only, no explanation: { "bullets": ["...", "..."] }`,
    user: `Project: ${project.title}${stack ? `\nTech stack: ${stack}` : ""}${project.description ? `\nDescription: ${project.description}` : ""}

Original bullets:
${rawBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

Rewrite these bullets following the rules. Return JSON only.`,
    parse: (raw) => {
      const match = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : raw);
      if (!Array.isArray(parsed.bullets)) throw new Error("invalid shape");
      return { bullets: parsed.bullets.filter((b: unknown) => typeof b === "string" && (b as string).trim()) };
    },
    maxTokens: 800,
    userId: user.id,
  });

  if (!result.ok) {
    return ok({ bullets: rawBullets, improved: false });
  }

  return ok({ bullets: result.data.bullets, improved: true });
});
