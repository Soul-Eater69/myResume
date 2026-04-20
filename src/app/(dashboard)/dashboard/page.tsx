import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Your career knowledge workspace."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardTitle>Profile</CardTitle>
          <CardDescription>{completeness}% complete</CardDescription>
          <div className="mt-3 h-2 bg-slate-100 rounded-full">
            <div className="h-2 bg-brand-500 rounded-full" style={{ width: `${completeness}%` }} />
          </div>
          <Link href="/profile" className="btn-ghost mt-3 text-sm">Open profile →</Link>
        </Card>
        <Card>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>{jobCount} saved</CardDescription>
          <Link href="/jobs" className="btn-ghost mt-3 text-sm">View jobs →</Link>
        </Card>
        <Card>
          <CardTitle>Resumes</CardTitle>
          <CardDescription>{resumeCount} generated</CardDescription>
          <Link href="/jobs" className="btn-ghost mt-3 text-sm">Generate new →</Link>
        </Card>
        <Card>
          <CardTitle>Applications</CardTitle>
          <CardDescription>{appCount} tracked</CardDescription>
          <Link href="/applications" className="btn-ghost mt-3 text-sm">Track →</Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle>Recent generated resumes</CardTitle>
          {recentResumes.length === 0 ? (
            <p className="muted text-sm mt-2">
              Generate your first resume by adding a job description.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {recentResumes.map((v) => (
                <li key={v.id} className="py-2 flex items-center justify-between text-sm">
                  <span className="truncate">
                    <span className="font-medium">{v.resume.title}</span>
                    {v.job ? <span className="muted"> · {v.job.company ?? "—"}</span> : null}
                  </span>
                  <Link className="btn-ghost" href={`/resume-builder/${v.jobId ?? ""}`}>Open</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardTitle>GitHub</CardTitle>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Badge variant={githubConn ? "verified" : "review"}>
              {githubConn ? "Connected" : "Not connected"}
            </Badge>
            <Link className="btn-ghost" href="/github">Manage →</Link>
          </div>
          <CardDescription className="mt-3">
            Import repositories as project evidence. Imports stay in review until you verify them.
          </CardDescription>
        </Card>
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
