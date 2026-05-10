import { requireUser } from "@/lib/auth";
import { handle, ok, parseJson } from "@/lib/api";
import { suggestRequestSchema } from "@/schemas/resume-studio";
import { generateSuggestions } from "@/modules/resumes/resume-studio-ai";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, suggestRequestSchema);

  const owned = await db.resume.findFirst({
    where: { id: input.resumeId, userId: user.id },
    select: { id: true },
  });
  if (!owned) throw notFound("resume not found");

  const result = await generateSuggestions({
    resume: input.resume,
    jobDescription: input.jobDescription,
    userPrompt: input.userPrompt,
    userId: user.id,
  });

  if (!result.ok) {
    return ok({
      assistantMessage: "AI is currently unavailable.",
      suggestions: [],
      source: "error",
    });
  }

  return ok({
    assistantMessage: result.data.assistantMessage,
    suggestions: result.data.suggestions,
    source: result.source,
  });
});
