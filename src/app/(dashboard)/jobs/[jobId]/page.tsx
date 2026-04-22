import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getJob, computeMatches } from "@/modules/jobs/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Icon } from "@/components/ui/icon";
import { db } from "@/lib/db";

export default async function JobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const user = await requireUser();
  const job = await getJob(user.id, jobId);
  const matches = await computeMatches(user.id, jobId);

  const [experiences, projects, repos] = await Promise.all([
    db.experience.findMany({
      where: { userId: user.id },
      select: { id: true, title: true, company: true },
    }),
    db.project.findMany({
      where: { userId: user.id },
      select: { id: true, title: true },
    }),
    db.githubRepo.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    }),
  ]);

  const experienceById = new Map(
    experiences.map((experience) => [experience.id, experience])
  );
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const repoById = new Map(repos.map((repo) => [repo.id, repo]));

  const signals = matches.signals;
  const evidenceCount =
    experienceById.size + projectById.size + repoById.size;
  const matchCount =
    matches.experienceMatches.length +
    matches.projectMatches.length +
    matches.repoMatches.length;
  const pageTitle = [job.title ?? "Job", job.company].filter(Boolean).join(" - ");

  return (
    <>
      <PageHeader
        title={pageTitle}
        description={job.sourceUrl ?? undefined}
        breadcrumbs={[{ label: "Jobs", href: "/jobs" }, { label: job.title ?? "Job" }]}
        actions={
          evidenceCount > 0 ? (
            <Link className="btn btn-md btn-primary" href={`/resume-builder/${job.id}`}>
              <Icon.Sparkles className="h-4 w-4" /> Generate tailored resume
            </Link>
          ) : (
            <Link className="btn btn-md btn-outline" href="/profile/experience">
              <Icon.User className="h-4 w-4" /> Add profile evidence first
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Signals</CardTitle>
          <CardDescription className="mt-1">
            Extracted from the JD. Drives ranking and composition.
          </CardDescription>
          <div className="mt-4 space-y-4 text-sm">
            <SignalBlock label="Seniority">
              <Badge variant="brand">{signals.seniority}</Badge>
            </SignalBlock>
            <SignalBlock label="Required skills">
              {signals.requiredSkills.length ? (
                <div className="flex flex-wrap gap-1">
                  {signals.requiredSkills.map((skill) => (
                    <span className="chip" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyHint />
              )}
            </SignalBlock>
            <SignalBlock label="Preferred skills">
              {signals.preferredSkills.length ? (
                <div className="flex flex-wrap gap-1">
                  {signals.preferredSkills.map((skill) => (
                    <span className="chip" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyHint />
              )}
            </SignalBlock>
            <SignalBlock label="Domain">
              {signals.domainTags.length ? (
                <div className="flex flex-wrap gap-1">
                  {signals.domainTags.map((tag) => (
                    <span className="chip" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyHint />
              )}
            </SignalBlock>
            <SignalBlock label="Summary">
              {signals.summary ? (
                <p className="text-fg">{signals.summary}</p>
              ) : (
                <EmptyHint />
              )}
            </SignalBlock>
          </div>
        </Card>

        <Card>
          <CardTitle>Top matches</CardTitle>
          <CardDescription className="mt-1">
            Ranked from your verified profile items.
          </CardDescription>
          {evidenceCount === 0 ? (
            <Empty
              className="mt-4"
              icon={<Icon.FileText className="h-5 w-5" />}
              title="No profile evidence yet"
              description="Add experience, projects, or GitHub repos so the app can rank the best evidence for this job."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link className="btn btn-sm btn-primary" href="/profile/experience">
                    Add experience
                  </Link>
                  <Link className="btn btn-sm btn-outline" href="/profile/projects">
                    Add projects
                  </Link>
                  <Link className="btn btn-sm btn-outline" href="/github">
                    Import GitHub
                  </Link>
                </div>
              }
            />
          ) : (
            <>
              <div className="mt-4 space-y-4 text-sm">
                <MatchList
                  label="Experience"
                  items={matches.experienceMatches.map((match) => {
                    const experience = experienceById.get(match.experienceId);
                    return {
                      id: match.experienceId,
                      label: experience
                        ? `${experience.title} - ${experience.company}`
                        : match.experienceId,
                      score: match.score,
                      reason: match.reason,
                    };
                  })}
                />
                <MatchList
                  label="Projects"
                  items={matches.projectMatches.map((match) => {
                    const project = projectById.get(match.projectId);
                    return {
                      id: match.projectId,
                      label: project?.title ?? match.projectId,
                      score: match.score,
                      reason: match.reason,
                    };
                  })}
                />
                <MatchList
                  label="Repos"
                  items={matches.repoMatches.map((match) => ({
                    id: match.repoId,
                    label: repoById.get(match.repoId)?.name ?? match.repoId,
                    score: match.score,
                    reason: match.reason,
                  }))}
                />
                {matches.skillMatches.length ? (
                  <div>
                    <div className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-fg-muted">
                      Skill overlap
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {matches.skillMatches.map((skillMatch) => (
                        <Badge variant="verified" key={skillMatch.skill}>
                          {skillMatch.skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              {matchCount === 0 && matches.skillMatches.length === 0 ? (
                <p className="mt-4 text-sm text-fg-muted">
                  No strong matches surfaced yet. Add richer bullets, tech stacks, or verified profile items to improve ranking.
                </p>
              ) : null}
            </>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <CardTitle>Full job description</CardTitle>
        <pre className="mt-3 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-md border border-border-subtle bg-surface-subtle p-3 font-mono text-sm text-fg-muted">
          {job.jdText}
        </pre>
      </Card>
    </>
  );
}

function SignalBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-fg-muted">
        {label}
      </div>
      {children}
    </div>
  );
}

function EmptyHint() {
  return <span className="text-xs text-fg-subtle">None yet.</span>;
}

function MatchList({
  label,
  items,
}: {
  label: string;
  items: { id: string; label: string; score: number; reason: string }[];
}) {
  return (
    <div>
      <div className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-fg-muted">
        {label}
      </div>
      {!items.length ? (
        <EmptyHint />
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border-subtle p-2"
            >
              <span className="truncate text-sm">{item.label}</span>
              <div className="flex shrink-0 items-center gap-2 text-xs">
                <span className="font-mono font-medium text-fg">
                  {Math.round(item.score * 100)}%
                </span>
                <span className="max-w-[160px] truncate text-fg-subtle">
                  {item.reason}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
