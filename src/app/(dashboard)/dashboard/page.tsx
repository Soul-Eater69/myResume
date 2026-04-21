import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, SectionHeader } from "@/components/layout/dashboard-shell";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { Icon } from "@/components/ui/icon";
import { Empty } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await requireUser();
  const [profile, expCount, projCount, skillCount, jobCount, resumeCount, appCount, githubConn, recentResumes] =
    await Promise.all([
      db.profile.findUnique({ where: { userId: user.id } }),
      db.experience.count({ where: { userId: user.id } }),
      db.project.count({ where: { userId: user.id } }),
      db.skill.count({ where: { userId: user.id } }),
      db.job.count({ where: { userId: user.id } }),
      db.resume.count({ where: { userId: user.id, kind: "generated" } }),
      db.application.count({ where: { userId: user.id } }),
      db.githubConnection.findUnique({ where: { userId: user.id } }),
      db.resumeVersion.findMany({
        where: { userId: user.id },
        include: { resume: true, job: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const completeness = computeCompleteness({
    hasSummary: Boolean(profile?.summary),
    hasExperience: expCount > 0,
    hasProjects: projCount > 0,
    hasSkills: skillCount > 0,
  });

  const firstName = user.name.split(" ")[0];
  const githubActive = githubConn?.connectionStatus === "active";

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Overview of your profile vault, pipeline, and integrations."
        actions={
          <Link href="/jobs" className="btn btn-md btn-primary">
            <Icon.Plus className="h-4 w-4" />
            Add job
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Stat
          label="Profile"
          value={`${completeness}%`}
          hint="Completeness across summary, experience, projects, and skills."
          href="/profile"
          icon={<Icon.User className="h-3.5 w-3.5" />}
        />
        <Stat
          label="Jobs"
          value={jobCount}
          hint={jobCount === 0 ? "Paste a JD to extract hiring signals." : "Tracked job descriptions."}
          href="/jobs"
          icon={<Icon.Briefcase className="h-3.5 w-3.5" />}
        />
        <Stat
          label="Resumes"
          value={resumeCount}
          hint="Generated versions."
          href="/jobs"
          icon={<Icon.FileText className="h-3.5 w-3.5" />}
        />
        <Stat
          label="Applications"
          value={appCount}
          hint="Tracked across pipeline stages."
          href="/applications"
          icon={<Icon.Kanban className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <SectionHeader
            title="Recent generated resumes"
            description="Your most recent tailored outputs."
            actions={
              <Link href="/jobs" className="btn btn-sm btn-ghost">
                View all <Icon.ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {recentResumes.length === 0 ? (
            <Empty
              icon={<Icon.FileText className="h-4 w-4" />}
              title="No generated resumes yet"
              description="Add a job description and generate your first tailored resume."
              action={
                <Link href="/jobs" className="btn btn-md btn-primary">
                  <Icon.Plus className="h-4 w-4" /> Add a job
                </Link>
              }
            />
          ) : (
            <Card padding="none">
              <ul className="divide-y divide-border-subtle">
                {recentResumes.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium text-fg truncate">{v.resume.title}</div>
                      <div className="text-xs text-fg-subtle mt-0.5 flex items-center gap-1.5">
                        {v.job ? (
                          <>
                            <Icon.Briefcase className="h-3 w-3" />
                            <span className="truncate">{v.job.title ?? "—"} · {v.job.company ?? "—"}</span>
                          </>
                        ) : (
                          <span>Unlinked</span>
                        )}
                        {v.versionName ? <Badge className="ml-1">{v.versionName}</Badge> : null}
                      </div>
                    </div>
                    {v.jobId ? (
                      <Link
                        className="btn btn-sm btn-outline"
                        href={`/resume-builder/${v.jobId}`}
                      >
                        Open
                      </Link>
                    ) : (
                      <a
                        className="btn btn-sm btn-outline"
                        href={`/api/resumes/${v.resumeId}/preview`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Preview
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <SectionHeader title="Integrations" />
          <Card>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-md bg-fg text-white flex items-center justify-center">
                  <Icon.Github className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-fg">GitHub</div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-fg-muted mt-0.5">
                    <StatusDot status={githubActive ? "success" : "neutral"} />
                    {githubActive ? "Connected" : "Not connected"}
                  </div>
                </div>
              </div>
              <Link href="/github" className="btn btn-sm btn-ghost">Manage</Link>
            </div>
            <CardDescription className="mt-3">
              Import repositories as project evidence. Imports stay review-needed until verified.
            </CardDescription>
          </Card>

          <Card>
            <CardTitle>Trust layer</CardTitle>
            <CardDescription className="mt-1">
              Every generated resume separates verified facts from AI suggestions.
            </CardDescription>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="verified" leftIcon={<Icon.CheckCircle className="h-3 w-3" />}>Verified</Badge>
              <Badge variant="review" leftIcon={<Icon.Circle className="h-3 w-3" />}>Review</Badge>
              <Badge variant="suggested" leftIcon={<Icon.Sparkles className="h-3 w-3" />}>Suggested</Badge>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function computeCompleteness(flags: {
  hasSummary: boolean;
  hasExperience: boolean;
  hasProjects: boolean;
  hasSkills: boolean;
}) {
  const weights = [flags.hasSummary, flags.hasExperience, flags.hasProjects, flags.hasSkills];
  const filled = weights.filter(Boolean).length;
  return Math.round((filled / weights.length) * 100);
}
