import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listJobs } from "@/modules/jobs/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Icon } from "@/components/ui/icon";
import { NewJobForm } from "./new-form";

export default async function JobsPage() {
  const user = await requireUser();
  const jobs = await listJobs(user.id);

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Paste a JD to extract hiring signals and prep a tailored resume."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {jobs.length === 0 ? (
            <Empty
              icon={<Icon.Briefcase className="h-4 w-4" />}
              title="No jobs yet"
              description="Add your first job on the right. We'll extract the required skills and domain signals."
            />
          ) : (
            jobs.map((j) => {
              const skills = ((j.signals?.requiredSkills as string[] | null) ?? []).slice(0, 6);
              return (
                <Link key={j.id} href={`/jobs/${j.id}`} className="block group">
                  <Card className="hover:border-border-strong transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-fg">{j.title ?? "(untitled role)"}</span>
                          <span className="text-xs text-fg-subtle">· {j.company ?? "—"}</span>
                        </div>
                        <div className="text-sm text-fg-muted mt-1.5 line-clamp-2">
                          {(j.signals?.summary as string | null) ?? `${j.jdText.slice(0, 220)}…`}
                        </div>
                        {skills.length ? (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {skills.map((s) => (
                              <span className="chip" key={s}>{s}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge leftIcon={<StatusDot status={statusTone(j.status)} />}>
                          {j.status}
                        </Badge>
                        <Icon.ChevronRight className="h-4 w-4 text-fg-faint group-hover:text-fg-subtle" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardTitle>Add job</CardTitle>
            <CardDescription className="mt-1">
              We store the JD, extract signals, then rank your profile items.
            </CardDescription>
            <NewJobForm />
          </Card>
        </div>
      </div>
    </>
  );
}

function statusTone(s: string): "success" | "warning" | "info" | "neutral" | "danger" {
  if (s === "applied" || s === "interview" || s === "offer") return "success";
  if (s === "screening") return "info";
  if (s === "rejected" || s === "withdrawn") return "danger";
  if (s === "saved") return "warning";
  return "neutral";
}
