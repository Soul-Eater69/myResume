import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getJob, computeMatches } from "@/modules/jobs/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { db } from "@/lib/db";

export default async function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await requireUser();
  const job = await getJob(user.id, jobId);
  const matches = await computeMatches(user.id, jobId);

  const experienceById = new Map(
    (await db.experience.findMany({ where: { userId: user.id } })).map((e) => [e.id, e])
  );
  const projectById = new Map(
    (await db.project.findMany({ where: { userId: user.id } })).map((p) => [p.id, p])
  );

  const signals = matches.signals;

  return (
    <>
      <PageHeader
        title={`${job.title ?? "Job"} · ${job.company ?? "—"}`}
        description={job.sourceUrl ?? undefined}
        breadcrumbs={[{ label: "Jobs", href: "/jobs" }, { label: job.title ?? "Job" }]}
        actions={
          <Link className="btn btn-md btn-primary" href={`/resume-builder/${job.id}`}>
            <Icon.Sparkles className="h-4 w-4" /> Generate tailored resume
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  {signals.requiredSkills.map((s) => (
                    <span className="chip" key={s}>{s}</span>
                  ))}
                </div>
              ) : <EmptyHint />}
            </SignalBlock>
            <SignalBlock label="Preferred skills">
              {signals.preferredSkills.length ? (
                <div className="flex flex-wrap gap-1">
                  {signals.preferredSkills.map((s) => (
                    <span className="chip" key={s}>{s}</span>
                  ))}
                </div>
              ) : <EmptyHint />}
            </SignalBlock>
            <SignalBlock label="Domain">
              {signals.domainTags.length ? (
                <div className="flex flex-wrap gap-1">
                  {signals.domainTags.map((s) => (
                    <span className="chip" key={s}>{s}</span>
                  ))}
                </div>
              ) : <EmptyHint />}
            </SignalBlock>
            <SignalBlock label="Summary">
              <p className="text-fg">{signals.summary}</p>
            </SignalBlock>
          </div>
        </Card>

        <Card>
          <CardTitle>Top matches</CardTitle>
          <CardDescription className="mt-1">
            Ranked from your verified profile items.
          </CardDescription>
          <div className="mt-4 space-y-4 text-sm">
            <MatchList
              label="Experience"
              items={matches.experienceMatches.map((m) => {
                const e = experienceById.get(m.experienceId);
                return {
                  id: m.experienceId,
                  label: e ? `${e.title} · ${e.company}` : m.experienceId,
                  score: m.score,
                  reason: m.reason,
                };
              })}
            />
            <MatchList
              label="Projects"
              items={matches.projectMatches.map((m) => {
                const p = projectById.get(m.projectId);
                return {
                  id: m.projectId,
                  label: p?.title ?? m.projectId,
                  score: m.score,
                  reason: m.reason,
                };
              })}
            />
            <MatchList
              label="Repos"
              items={matches.repoMatches.map((m) => ({
                id: m.repoId,
                label: m.repoId,
                score: m.score,
                reason: m.reason,
              }))}
            />
            {matches.skillMatches.length ? (
              <div>
                <div className="text-2xs font-medium text-fg-muted uppercase tracking-wide mb-1.5">Skill overlap</div>
                <div className="flex flex-wrap gap-1">
                  {matches.skillMatches.map((s) => (
                    <Badge variant="verified" key={s.skill}>{s.skill}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardTitle>Full job description</CardTitle>
        <pre className="whitespace-pre-wrap mt-3 text-sm font-mono text-fg-muted max-h-[480px] overflow-auto border border-border-subtle rounded-md p-3 bg-surface-subtle">
{job.jdText}
        </pre>
      </Card>
    </>
  );
}

function SignalBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-2xs font-medium text-fg-muted uppercase tracking-wide mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function EmptyHint() {
  return <span className="text-xs text-fg-subtle">—</span>;
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
      <div className="text-2xs font-medium text-fg-muted uppercase tracking-wide mb-1.5">{label}</div>
      {!items.length ? (
        <EmptyHint />
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 p-2 rounded-md border border-border-subtle">
              <span className="truncate text-sm">{it.label}</span>
              <div className="flex items-center gap-2 shrink-0 text-xs">
                <span className="font-mono font-medium text-fg">{Math.round(it.score * 100)}%</span>
                <span className="text-fg-subtle truncate max-w-[160px]">{it.reason}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
