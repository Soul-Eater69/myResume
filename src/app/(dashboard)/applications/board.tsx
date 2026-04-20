"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

const STAGES = ["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"] as const;
type Stage = (typeof STAGES)[number];

type App = {
  id: string;
  status: string;
  jobTitle: string;
  company: string;
  notes: string;
  resumeVersionId: string;
  appliedAt: string;
  followUpAt: string;
};

export function ApplicationsBoard({
  apps,
  jobs,
  versions,
}: {
  apps: App[];
  jobs: { id: string; label: string }[];
  versions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [resumeVersionId, setResumeVersionId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Stage>("saved");

  async function create() {
    if (!jobId) return;
    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        resumeVersionId: resumeVersionId || null,
        status,
        notes: notes || null,
      }),
    });
    setNotes("");
    router.refresh();
  }

  async function updateStatus(id: string, newStatus: Stage) {
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Create application</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <div className="md:col-span-2">
            <Label>Job</Label>
            <select className="input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
              {jobs.map((j) => (
                <option value={j.id} key={j.id}>{j.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Status</Label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Stage)}>
              {STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div>
            <Label>Resume version</Label>
            <select className="input" value={resumeVersionId} onChange={(e) => setResumeVersionId(e.target.value)}>
              <option value="">—</option>
              {versions.map((v) => (<option key={v.id} value={v.id}>{v.label}</option>))}
            </select>
          </div>
          <div className="md:col-span-4">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <Button onClick={create} disabled={!jobId}>Create</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {STAGES.map((stage) => (
          <div key={stage}>
            <div className="text-xs uppercase tracking-wide muted px-1 pb-2">{stage}</div>
            <div className="space-y-2">
              {apps.filter((a) => a.status === stage).map((a) => (
                <Card key={a.id} className="p-3">
                  <div className="font-medium text-sm">{a.jobTitle}</div>
                  <div className="text-xs muted">{a.company}</div>
                  {a.notes ? <div className="text-xs mt-1">{a.notes}</div> : null}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {STAGES.filter((s) => s !== stage).slice(0, 3).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(a.id, s)}
                        className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200"
                      >
                        → {s}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
