import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { computeMatches, getJob } from "@/modules/jobs/service";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { ResumeBuilderClient } from "./client";

export default async function ResumeBuilderPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const user = await requireUser();
  const job = await getJob(user.id, jobId);
  const matches = await computeMatches(user.id, jobId);

  const [experiences, projects, repos, versions] = await Promise.all([
    db.experience.findMany({
      where: { userId: user.id },
      orderBy: [{ isCurrent: "desc" }, { endDate: "desc" }],
      select: { id: true, company: true, title: true },
    }),
    db.project.findMany({
      where: { userId: user.id, isVerified: true },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
    db.githubRepo.findMany({
      where: { userId: user.id },
      include: { summary: true },
    }),
    db.resumeVersion.findMany({
      where: { userId: user.id, jobId },
      orderBy: { createdAt: "desc" },
      include: { resume: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title={`Resume builder — ${job.title ?? "job"}`}
        description={`${job.company ?? ""} · tailored to this JD`}
        actions={
          <Link className="btn btn-md btn-outline" href={`/jobs/${job.id}`}>
            ← Back to job
          </Link>
        }
      />

      <ResumeBuilderClient
        jobId={job.id}
        experiences={experiences.map((e) => ({ id: e.id, label: `${e.title} · ${e.company}` }))}
        projects={projects.map((p) => ({ id: p.id, label: p.title }))}
        repos={repos
          .filter((r) => r.summary)
          .map((r) => ({
            id: r.id,
            label: `${r.name} (${(r.summary?.confidenceScores as any)?.ownership ?? "?"} ownership)`,
          }))}
        preselectedExperienceIds={matches.experienceMatches.slice(0, 4).map((m) => m.experienceId)}
        preselectedProjectIds={matches.projectMatches.slice(0, 3).map((m) => m.projectId)}
        preselectedRepoIds={matches.repoMatches.slice(0, 2).map((m) => m.repoId)}
        versions={versions.map((v) => ({
          id: v.id,
          resumeId: v.resumeId,
          title: v.resume.title,
          versionName: v.versionName,
          createdAt: v.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
