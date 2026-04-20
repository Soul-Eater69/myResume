import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { saveUpload, parseUpload, applyParsedResume } from "@/modules/profile/upload";
import { badRequest } from "@/lib/errors";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const form = await req.formData();
  const file = form.get("file");
  const apply = form.get("apply") === "true";
  if (!(file instanceof File)) throw badRequest("file is required");

  const buf = Buffer.from(await file.arrayBuffer());
  const upload = await saveUpload(user.id, {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    buffer: buf,
  });

  const result = await parseUpload(user.id, upload.id);
  if (apply) {
    await applyParsedResume(user.id, result.parsed);
  }
  return ok({
    uploadId: upload.id,
    applied: apply,
    parsed: result.parsed,
    rawText: result.rawText.slice(0, 20000),
  });
});
