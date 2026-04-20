"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Select, Field } from "@/components/ui/input";
import { StatusDot } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

const STAGES = ["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_TONE: Record<Stage, "success" | "info" | "warning" | "danger" | "neutral"> = {
  saved: "neutral",
  applied: "info",
  screening: "info",
  interview: "warning",
  offer: "success",
  rejected: "danger",
  withdrawn: "neutral",
};

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
  const toast = useToast();
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [resumeVersionId, setResumeVersionId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Stage>("saved");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!jobId) return;
    setSaving(true);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        resumeVersionId: resumeVersionId || null,
        status,
        notes: notes || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setNotes("");
      toast.success("Application added");
      router.refresh();
    } else {
      toast.error("Could not add application");
    }
  }

  async function updateStatus(id: string, newStatus: Stage) {
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    toast.success(`Moved to ${newStatus}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>New application</CardTitle>
        <CardDescription className="mt-1">
          Link a job and (optionally) the resume version you sent.
        </CardDescription>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <Field label="Job" className="md:col-span-2">
            <Select value={jobId} onChange={(e) => setJobId(e.target.value)}>
              {jobs.length === 0 ? <option value="">No jobs yet</option> : null}
              {jobs.map((j) => (
                <option value={j.id} key={j.id}>{j.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as Stage)}>
              {STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </Select>
          </Field>
          <Field label="Resume version">
            <Select value={resumeVersionId} onChange={(e) => setResumeVersionId(e.target.value)}>
              <option value="">—</option>
              {versions.map((v) => (<option key={v.id} value={v.id}>{v.label}</option>))}
            </Select>
          </Field>
          <Field label="Notes" className="md:col-span-4">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Recruiter intro, referral, next-step dates…" />
          </Field>
        </div>
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <Button
            onClick={create}
            disabled={!jobId}
            loading={saving}
            loadingText="Creating…"
            leftIcon={<Icon.Plus className="h-4 w-4" />}
          >
            Create application
          </Button>
        </div>
      </Card>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
        {STAGES.map((stage) => {
          const stageItems = apps.filter((a) => a.status === stage);
          return (
            <div key={stage} className="shrink-0 w-72">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="inline-flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wider text-fg-muted">
                  <StatusDot status={STAGE_TONE[stage]} />
                  {stage}
                </div>
                <span className="text-xs text-fg-subtle">{stageItems.length}</span>
              </div>
              <div className="space-y-2 min-h-[120px]">
                {stageItems.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border-subtle bg-surface-subtle/60 h-20 flex items-center justify-center text-2xs text-fg-faint">
                    No items
                  </div>
                ) : (
                  stageItems.map((a) => (
                    <div key={a.id} className="surface p-3">
                      <div className="text-sm font-semibold text-fg truncate">{a.jobTitle}</div>
                      <div className="text-xs text-fg-subtle truncate mt-0.5">{a.company}</div>
                      {a.notes ? (
                        <div className="text-xs text-fg-muted mt-2 line-clamp-2">{a.notes}</div>
                      ) : null}
                      <div className="mt-2.5 pt-2.5 border-t border-border-subtle flex flex-wrap gap-1">
                        {STAGES.filter((s) => s !== stage).slice(0, 3).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(a.id, s)}
                            className="inline-flex items-center gap-1 text-2xs h-5 px-1.5 rounded border border-border-subtle bg-white text-fg-muted hover:bg-surface-muted hover:text-fg transition-colors"
                          >
                            <Icon.ArrowRight className="h-2.5 w-2.5" /> {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
