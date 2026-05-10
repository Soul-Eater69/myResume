import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import {
  emptyResumeData,
  resumeDataSchema,
  type ResumeData,
} from "@/schemas/resume-studio";

const STUDIO_KIND = "studio";

export async function getOrCreateStudioResume(userId: string): Promise<{
  id: string;
  title: string;
  data: ResumeData;
}> {
  const existing = await db.resume.findFirst({
    where: { userId, kind: STUDIO_KIND },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) {
    const parsed = resumeDataSchema.safeParse(existing.contentJson);
    return {
      id: existing.id,
      title: existing.title,
      data: parsed.success ? parsed.data : emptyResumeData(),
    };
  }
  const user = await db.user.findUnique({ where: { id: userId } });
  const seed = emptyResumeData({ name: user?.name, email: user?.email });
  const created = await db.resume.create({
    data: {
      userId,
      kind: STUDIO_KIND,
      title: "My resume",
      contentJson: seed,
    },
  });
  return { id: created.id, title: created.title, data: seed };
}

export async function loadStudioResume(
  userId: string,
  resumeId: string
): Promise<{ id: string; title: string; data: ResumeData }> {
  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId },
  });
  if (!resume) throw notFound("resume not found");
  const parsed = resumeDataSchema.safeParse(resume.contentJson);
  return {
    id: resume.id,
    title: resume.title,
    data: parsed.success ? parsed.data : emptyResumeData(),
  };
}

export async function saveStudioResume(
  userId: string,
  resumeId: string,
  data: ResumeData,
  opts: { versionName?: string; saveAsNewVersion?: boolean } = {}
): Promise<{ resumeId: string; versionId?: string; updatedAt: Date }> {
  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId },
  });
  if (!resume) throw notFound("resume not found");

  const updated = await db.resume.update({
    where: { id: resume.id },
    data: { contentJson: data },
  });

  let versionId: string | undefined;
  if (opts.saveAsNewVersion) {
    const version = await db.resumeVersion.create({
      data: {
        userId,
        resumeId: resume.id,
        versionName: opts.versionName ?? `v${Date.now()}`,
        generationMode: "studio",
      },
    });
    versionId = version.id;
  }

  return { resumeId: updated.id, versionId, updatedAt: updated.updatedAt };
}

export async function listStudioVersions(userId: string, resumeId: string) {
  return db.resumeVersion.findMany({
    where: { userId, resumeId },
    orderBy: { createdAt: "desc" },
    select: { id: true, versionName: true, createdAt: true, generationMode: true },
  });
}
