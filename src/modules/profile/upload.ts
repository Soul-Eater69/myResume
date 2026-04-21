import { db } from "@/lib/db";
import { notFound, badRequest } from "@/lib/errors";
import { putObject, getObject } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { parseResumeText } from "@/modules/ai/parser";

export async function saveUpload(
  userId: string,
  file: { name: string; mimeType: string; buffer: Buffer }
) {
  const { storageKey, sizeBytes } = await putObject(userId, file.name, file.buffer);
  return db.uploadedFile.create({
    data: {
      userId,
      fileType: "resume",
      originalName: file.name,
      storageKey,
      mimeType: file.mimeType,
      sizeBytes: BigInt(sizeBytes),
      parseStatus: "queued",
      errorMessage: null,
    },
  });
}

export async function getUploadStatus(userId: string, uploadId: string) {
  const upload = await db.uploadedFile.findFirst({
    where: { id: uploadId, userId, fileType: "resume" },
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      parseStatus: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!upload) throw notFound("upload not found");
  return upload;
}

export async function processResumeUpload(
  userId: string,
  uploadId: string,
  apply: boolean
) {
  const upload = await db.uploadedFile.findFirst({
    where: { id: uploadId, userId, fileType: "resume" },
  });
  if (!upload) throw notFound("upload not found");

  await updateUploadStatus(uploadId, "extracting_text");

  try {
    const data = await getObject(upload.storageKey);
    const text = await extractText(data, upload.mimeType, upload.originalName);
    if (!text.trim()) throw badRequest("could not extract text from upload");

    await updateUploadStatus(uploadId, "parsing_resume");
    const parsed = await parseResumeText(text, userId);

    if (apply) {
      await updateUploadStatus(uploadId, "applying_profile");
      await applyParsedResume(userId, parsed);
    }

    await updateUploadStatus(uploadId, "completed");
    return { rawText: text, parsed };
  } catch (err) {
    logger.error("resume_upload_parse_failed", {
      uploadId,
      userId,
      mimeType: upload.mimeType,
      originalName: upload.originalName,
      message: err instanceof Error ? err.message : "unknown error",
    });
    await updateUploadStatus(
      uploadId,
      "failed",
      err instanceof Error ? err.message : "Upload processing failed."
    );
    throw err;
  }
}

async function extractText(
  buf: Buffer,
  mime: string,
  originalName: string
): Promise<string> {
  if (isPdfUpload(buf, mime, originalName)) {
    try {
      const mod = await import("pdf-parse");
      const parser = (mod as any).default ?? mod;
      const out = await parser(buf);
      return typeof out.text === "string" ? out.text : "";
    } catch (err) {
      throw badRequest(
        "We couldn't read text from that PDF. Try a text-based PDF or upload a TXT/MD resume instead."
      );
    }
  }
  return buf.toString("utf8");
}

export async function applyParsedResume(
  userId: string,
  parsed: Awaited<ReturnType<typeof parseResumeText>>
) {
  if (parsed.basics.email || parsed.basics.name) {
    await db.profile.upsert({
      where: { userId },
      create: {
        userId,
        headline: parsed.basics.headline ?? null,
        summary: parsed.summary ?? null,
      },
      update: {
        headline: parsed.basics.headline ?? undefined,
        summary: parsed.summary ?? undefined,
      },
    });
  }

  for (const link of parsed.basics.links) {
    await db.profileLink.create({ data: { userId, label: link.label, url: link.url } }).catch(() => {});
  }

  for (const skill of parsed.skills) {
    await db.skill
      .upsert({
        where: { userId_name: { userId, name: skill } },
        create: { userId, name: skill, isVerified: false },
        update: {},
      })
      .catch(() => {});
  }

  for (const exp of parsed.experience) {
    await db.experience.create({
      data: {
        userId,
        company: exp.company,
        title: exp.title,
        location: exp.location ?? null,
        startDate: parseLooseResumeDate(exp.startDate),
        endDate: parseLooseResumeDate(exp.endDate),
        isCurrent: exp.isCurrent,
        sourceType: "parsed",
        bullets: {
          create: exp.bullets.map((b, i) => ({
            bulletText: b,
            sortOrder: i,
            isVerified: false,
          })),
        },
      },
    });
  }

  for (const proj of parsed.projects) {
    await db.project.create({
      data: {
        userId,
        title: proj.title,
        description: proj.description ?? null,
        repoUrl: proj.repoUrl ?? null,
        liveUrl: proj.liveUrl ?? null,
        sourceType: "parsed",
        isVerified: false,
        bullets: {
          create: proj.bullets.map((b, i) => ({
            bulletText: b,
            sortOrder: i,
            isVerified: false,
          })),
        },
      },
    });
  }

  for (const ed of parsed.education) {
    await db.education.create({
      data: {
        userId,
        institution: ed.institution,
        degree: ed.degree ?? null,
        fieldOfStudy: ed.fieldOfStudy ?? null,
        startDate: parseLooseResumeDate(ed.startDate),
        endDate: parseLooseResumeDate(ed.endDate),
      },
    });
  }
}

function isPdfUpload(buf: Buffer, mimeType: string, originalName: string) {
  const mime = mimeType.toLowerCase();
  const name = originalName.toLowerCase();
  return (
    mime.includes("pdf") ||
    name.endsWith(".pdf") ||
    buf.subarray(0, 4).toString("ascii") === "%PDF"
  );
}

function parseLooseResumeDate(value: string | null | undefined) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^(present|current|now|ongoing)$/i.test(trimmed)) return null;

  const direct = Date.parse(trimmed);
  if (!Number.isNaN(direct)) return new Date(direct);

  const monthYear = trimmed.match(/^(\d{1,2})[/-](\d{4})$/);
  if (monthYear) {
    const month = Number(monthYear[1]);
    const year = Number(monthYear[2]);
    if (month >= 1 && month <= 12) return new Date(year, month - 1, 1);
  }

  const yearOnly = trimmed.match(/^(\d{4})$/);
  if (yearOnly) return new Date(Number(yearOnly[1]), 0, 1);

  return null;
}

async function updateUploadStatus(
  uploadId: string,
  parseStatus: string,
  errorMessage: string | null = null
) {
  await db.uploadedFile.update({
    where: { id: uploadId },
    data: { parseStatus, errorMessage },
  });
}
