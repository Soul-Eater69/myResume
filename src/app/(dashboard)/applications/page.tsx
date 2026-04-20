import { requireUser } from "@/lib/auth";
import { listApplications } from "@/modules/applications/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { ApplicationsBoard } from "./board";
import { db } from "@/lib/db";

export default async function ApplicationsPage() {
  const user = await requireUser();
  const [apps, jobs, versions] = await Promise.all([
    listApplications(user.id),
    db.job.findMany({ where: { userId: user.id }, select: { id: true, title: true, company: true } }),
    db.resumeVersion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { resume: true, job: true },
    }),
  ]);

  return (
    <>
      <PageHeader title="Applications" description="Track stages, link the resume version you sent, and record notes." />
      <ApplicationsBoard
        apps={apps.map((a) => ({
          id: a.id,
          status: a.status,
          jobTitle: a.job.title ?? "(no title)",
          company: a.job.company ?? "—",
          notes: a.notes ?? "",
          resumeVersionId: a.resumeVersionId ?? "",
          appliedAt: a.appliedAt ? a.appliedAt.toISOString().slice(0, 10) : "",
          followUpAt: a.followUpAt ? a.followUpAt.toISOString().slice(0, 10) : "",
        }))}
        jobs={jobs.map((j) => ({ id: j.id, label: `${j.title ?? "(no title)"} · ${j.company ?? "—"}` }))}
        versions={versions.map((v) => ({
          id: v.id,
          label: `${v.resume.title}${v.versionName ? ` (${v.versionName})` : ""}`,
        }))}
      />
    </>
  );
}
