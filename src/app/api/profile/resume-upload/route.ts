import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { saveUpload } from "@/modules/profile/upload";
import { scheduleResumeUpload } from "@/modules/profile/upload-queue";
import { badRequest } from "@/lib/errors";

export const runtime = "nodejs";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const form = await req.formData();
  const file = form.get("file");
  const apply = form.get("apply") === "true";
  if (!(file instanceof File)) throw badRequest("file is required");

  const buf = Buffer.from(await file.arrayBuffer());
  const mimeType = inferUploadMimeType(file.name, file.type);
  const upload = await saveUpload(user.id, {
    name: file.name,
    mimeType,
    buffer: buf,
  });
  await scheduleResumeUpload({ userId: user.id, uploadId: upload.id, apply });
  return ok({
    uploadId: upload.id,
    applied: apply,
    parseStatus: upload.parseStatus,
  }, { status: 202 });
});

function inferUploadMimeType(name: string, mimeType: string) {
  if (mimeType) return mimeType;

  const lowerName = name.toLowerCase();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".md")) return "text/markdown";
  if (lowerName.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
}
