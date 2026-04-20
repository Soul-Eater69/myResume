import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import type { ApplicationInput } from "@/schemas/application";

export async function listApplications(userId: string) {
  return db.application.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { job: true, resumeVersion: { include: { resume: true } } },
  });
}

export async function createApplication(userId: string, input: ApplicationInput) {
  const job = await db.job.findFirst({ where: { id: input.jobId, userId } });
  if (!job) throw notFound("job not found");

  return db.application.create({
    data: {
      userId,
      jobId: input.jobId,
      resumeVersionId: input.resumeVersionId ?? null,
      status: input.status ?? "saved",
      appliedAt: input.appliedAt ? new Date(input.appliedAt) : null,
      followUpAt: input.followUpAt ? new Date(input.followUpAt) : null,
      notes: input.notes ?? null,
    },
  });
}

export async function getApplication(userId: string, id: string) {
  const app = await db.application.findFirst({
    where: { id, userId },
    include: { job: true, resumeVersion: { include: { resume: true } } },
  });
  if (!app) throw notFound("application not found");
  return app;
}

export async function patchApplication(
  userId: string,
  id: string,
  patch: Partial<ApplicationInput>
) {
  const existing = await db.application.findFirst({ where: { id, userId } });
  if (!existing) throw notFound("application not found");
  return db.application.update({
    where: { id },
    data: {
      resumeVersionId: patch.resumeVersionId ?? undefined,
      status: patch.status ?? undefined,
      appliedAt:
        patch.appliedAt === undefined
          ? undefined
          : patch.appliedAt
          ? new Date(patch.appliedAt)
          : null,
      followUpAt:
        patch.followUpAt === undefined
          ? undefined
          : patch.followUpAt
          ? new Date(patch.followUpAt)
          : null,
      notes: patch.notes ?? undefined,
    },
  });
}

export async function deleteApplication(userId: string, id: string) {
  const res = await db.application.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw notFound("application not found");
}
