import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listJobs } from "@/modules/jobs/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewJobForm } from "./new-form";

export default async function JobsPage() {
  const user = await requireUser();
  const jobs = await listJobs(user.id);

  return (
    <>
      <PageHeader title="Jobs" description="Paste a JD to extract hiring signals and prep a tailored resume." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {jobs.length === 0 ? (
            <Card>
              <CardTitle>No jobs yet</CardTitle>
              <p className="muted text-sm mt-2">Add your first job on the right.</p>
            </Card>
          ) : (
            jobs.map((j) => (
              <Link key={j.id} href={`/jobs/${j.id}`} className="block">
                <Card className="hover:border-brand-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">
                        {j.title ?? "(untitled role)"} <span className="muted">· {j.company ?? "—"}</span>
                      </div>
                      <div className="text-sm muted mt-1">{(j.signals?.summary as string | null) ?? j.jdText.slice(0, 160)}…</div>
                      {j.signals ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {((j.signals.requiredSkills as string[] | null) ?? []).slice(0, 6).map((s) => (
                            <span className="badge" key={s}>{s}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <Badge>{j.status}</Badge>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
        <div>
          <Card>
            <CardTitle>Add job</CardTitle>
            <NewJobForm />
          </Card>
        </div>
      </div>
    </>
  );
}
