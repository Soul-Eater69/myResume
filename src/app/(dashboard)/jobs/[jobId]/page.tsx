import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getJob, computeMatches } from "@/modules/jobs/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";

export default async function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await requireUser();
  const job = await getJob(user.id, jobId);
  const matches = await computeMatches(user.id, jobId);

  const experienceById = new Map(
    (await db.experience.findMany({ where: { userId: user.id } })).map((e) => [
      e.id,
      e,
    ])
  );
  const projectById = new Map(
    (await db.project.findMany({ where: { userId: user.id } })).map((p) => [
      p.id,
      p,
    ])
  );

  const signals = matches.signals;

  return (
    <>
      <PageHeader
        title={`${job.title ?? "Job"} — ${job.company ?? ""}`}
        description={job.sourceUrl ?? undefined}
        actions={
          <Link className="btn-primary" href={`/resume-builder/${job.id}`}>
            Generate tailored resume
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle>Signals</CardTitle>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <div className="muted mb-1">Seniority</div>
              <Badge>{signals.seniority}</Badge>
            </div>
            <div>
              <div className="muted mb-1">Required skills</div>
              <div className="flex flex-wrap gap-1">
                {signals.requiredSkills.map((s) => (
                  <span className="badge" key={s}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="muted mb-1">Preferred skills</div>
              <div className="flex flex-wrap gap-1">
                {signals.preferredSkills.map((s) => (
                  <span className="badge" key={s}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="muted mb-1">Domain</div>
              <div className="flex flex-wrap gap-1">
                {signals.domainTags.map((s) => (
                  <span className="badge" key={s}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="muted mb-1">Summary</div>
              <p>{signals.summary}</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Top matches</CardTitle>
          <div className="mt-3 space-y-3 text-sm">
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
                <div className="font-medium mb-1">Skill overlap</div>
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
        <pre className="whitespace-pre-wrap mt-3 text-sm font-mono text-slate-700">
{job.jdText}
        </pre>
      </Card>
    </>
  );
}

function MatchList({
  label,
  items,
}: {
  label: string;
  items: { id: string; label: string; score: number; reason: string }[];
}) {
  if (!items.length) {
    return (
      <div>
        <div className="font-medium mb-1">{label}</div>
        <div className="muted">No matches yet.</div>
      </div>
    );
  }
  return (
    <div>
      <div className="font-medium mb-1">{label}</div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.id} className="flex items-start justify-between gap-2">
            <span className="truncate">{it.label}</span>
            <span className="muted shrink-0">{Math.round(it.score * 100)}% · {it.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
