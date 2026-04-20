import { db } from "@/lib/db";
import { notFound, badRequest } from "@/lib/errors";
import { putObject, getObject } from "@/lib/storage";
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
      parseStatus: "pending",
    },
  });
}

export async function parseUpload(userId: string, uploadId: string) {
  const upload = await db.uploadedFile.findFirst({
    where: { id: uploadId, userId },
  });
  if (!upload) throw notFound("upload not found");

  await db.uploadedFile.update({
    where: { id: uploadId },
    data: { parseStatus: "processing" },
  });

  try {
    const data = await getObject(upload.storageKey);
    const text = await extractText(data, upload.mimeType);
    if (!text.trim()) throw badRequest("could not extract text from upload");
    const parsed = await parseResumeText(text, userId);
    await db.uploadedFile.update({
      where: { id: uploadId },
      data: { parseStatus: "completed" },
    });
    return { rawText: text, parsed };
  } catch (err) {
    await db.uploadedFile.update({
      where: { id: uploadId },
      data: { parseStatus: "failed" },
    });
    throw err;
  }
}

async function extractText(buf: Buffer, mime: string): Promise<string> {
  if (mime.includes("pdf")) {
    const mod = await import("pdf-parse");
    const parser = (mod as any).default ?? mod;
    const out = await parser(buf);
    return out.text || "";
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
        startDate: exp.startDate ? new Date(exp.startDate) : null,
        endDate: exp.endDate ? new Date(exp.endDate) : null,
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
        startDate: ed.startDate ? new Date(ed.startDate) : null,
        endDate: ed.endDate ? new Date(ed.endDate) : null,
      },
    });
  }
}
