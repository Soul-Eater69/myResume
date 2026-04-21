import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getArchetypeFocusAreas } from "@/modules/ai/signals";
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
        title={`Resume builder - ${job.title ?? "job"}`}
        description={
          job.company ? `${job.company} - tailored to this JD` : "Tailored to this JD"
        }
        actions={
          <>
            <Link className="btn-outline" href={`/interview-prep/${job.id}`}>
              Interview Prep
            </Link>
            <Link className="btn-outline" href={`/jobs/${job.id}`}>
              Back to job
            </Link>
          </>
        }
      />

      <ResumeBuilderClient
        jobId={job.id}
        experiences={experiences.map((experience) => ({
          id: experience.id,
          label: `${experience.title} - ${experience.company}`,
        }))}
        projects={projects.map((project) => ({
          id: project.id,
          label: project.title,
        }))}
        repos={repos
          .filter((repo) => repo.summary)
          .map((repo) => ({
            id: repo.id,
            label: `${repo.name} (${(repo.summary?.confidenceScores as any)?.ownership ?? "?"} ownership)`,
          }))}
        preselectedExperienceIds={matches.experienceMatches
          .slice(0, 4)
          .map((match) => match.experienceId)}
        preselectedProjectIds={matches.projectMatches
          .slice(0, 3)
          .map((match) => match.projectId)}
        preselectedRepoIds={matches.repoMatches
          .slice(0, 2)
          .map((match) => match.repoId)}
        jobSummary={matches.signals.summary}
        archetype={matches.signals.archetype ?? "Software Engineer"}
        seniority={matches.signals.seniority}
        requiredSkills={matches.signals.requiredSkills}
        preferredSkills={matches.signals.preferredSkills}
        keywords={matches.signals.keywords}
        focusAreas={getArchetypeFocusAreas(matches.signals.archetype)}
        versions={versions.map((version) => ({
          id: version.id,
          resumeId: version.resumeId,
          title: version.resume.title,
          versionName: version.versionName,
          createdAt: version.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
