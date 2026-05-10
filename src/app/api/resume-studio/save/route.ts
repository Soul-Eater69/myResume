import { requireUser } from "@/lib/auth";
import { handle, ok, parseJson } from "@/lib/api";
import { saveRequestSchema } from "@/schemas/resume-studio";
import { saveStudioResume } from "@/modules/resumes/resume-studio";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, saveRequestSchema);
  const result = await saveStudioResume(user.id, input.resumeId, input.resume, {
    versionName: input.versionName,
    saveAsNewVersion: input.saveAsNewVersion ?? false,
  });
  return ok({
    resumeId: result.resumeId,
    versionId: result.versionId ?? null,
    updatedAt: result.updatedAt.toISOString(),
  });
});
