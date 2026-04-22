import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { badRequest, notFound } from "@/lib/errors";
import { db } from "@/lib/db";
import { resumeJsonSchema, type ResumeJson } from "@/schemas/resume";
import { llmJson, isLlmAvailableFor, extractJsonBlock } from "@/modules/ai/provider";
import { RESUME_CHAT_SYSTEM_PROMPT } from "@/modules/ai/prompts";
import { renderResumeHtml } from "@/modules/exports/html";

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  currentJson: z.record(z.unknown()),
  pageConstraint: z.enum(["one_page", "two_page"]).default("one_page"),
});

export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();

  const resume = await db.resume.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true, sourceContextJson: true },
  });
  if (!resume) throw notFound("resume not found");

  const body = chatSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) throw badRequest("invalid request body");

  const { message, currentJson, pageConstraint } = body.data;

  if (!await isLlmAvailableFor(user.id)) {
    return ok({ ok: false, reason: "no_ai_configured" });
  }

  const sourceCtx = resume.sourceContextJson as Record<string, unknown> | null;
  const jobContext = buildJobContext(sourceCtx);

  const userPrompt = [
    jobContext ? `Target role context:\n${jobContext}\n` : "",
    "Current resume JSON:",
    JSON.stringify(currentJson, null, 0),
    `\nUser request: ${message}`,
    "\nReturn the complete updated resume JSON only.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await llmJson<ResumeJson>({
    system: RESUME_CHAT_SYSTEM_PROMPT,
    user: userPrompt,
    parse: (raw) => resumeJsonSchema.parse(JSON.parse(extractJsonBlock(raw))),
    maxTokens: 4000,
    userId: user.id,
  });

  if (!result.ok) {
    return ok({ ok: false, reason: result.reason });
  }

  const html = renderResumeHtml(result.data, pageConstraint);

  return ok({ ok: true, resume: result.data, previewHtml: html });
});

function buildJobContext(sourceCtx: Record<string, unknown> | null): string | null {
  if (!sourceCtx) return null;
  const signals = sourceCtx.signals as Record<string, unknown> | undefined;
  if (!signals) return null;

  const parts: string[] = [];
  if (Array.isArray(signals.requiredSkills) && signals.requiredSkills.length) {
    parts.push(`Required skills: ${(signals.requiredSkills as string[]).join(", ")}`);
  }
  if (Array.isArray(signals.preferredSkills) && signals.preferredSkills.length) {
    parts.push(`Preferred skills: ${(signals.preferredSkills as string[]).join(", ")}`);
  }
  if (typeof signals.archetype === "string") {
    parts.push(`Role archetype: ${signals.archetype}`);
  }
  return parts.length ? parts.join("\n") : null;
}
