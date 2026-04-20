"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/input";
import { ResumePreviewFrame } from "@/components/resume/resume-preview";

type Option = { id: string; label: string };

export function ResumeBuilderClient({
  jobId,
  experiences,
  projects,
  repos,
  preselectedExperienceIds,
  preselectedProjectIds,
  preselectedRepoIds,
  versions,
}: {
  jobId: string;
  experiences: Option[];
  projects: Option[];
  repos: Option[];
  preselectedExperienceIds: string[];
  preselectedProjectIds: string[];
  preselectedRepoIds: string[];
  versions: { id: string; resumeId: string; title: string; versionName: string | null; createdAt: string }[];
}) {
  const router = useRouter();
  const [expIds, setExpIds] = useState<string[]>(preselectedExperienceIds);
  const [projIds, setProjIds] = useState<string[]>(preselectedProjectIds);
  const [repoIds, setRepoIds] = useState<string[]>(preselectedRepoIds);
  const [pageConstraint, setPageConstraint] = useState<"one_page" | "two_page">("one_page");
  const [versionName, setVersionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function toggle(set: string[], id: string, setter: (v: string[]) => void) {
    if (set.includes(id)) setter(set.filter((x) => x !== id));
    else setter([...set, id]);
  }

  async function generate() {
    setLoading(true);
    setPreview(null);
    setWarnings([]);
    setErrors([]);
    const res = await fetch("/api/resumes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        selectedExperienceIds: expIds,
        selectedProjectIds: projIds,
        selectedRepoIds: repoIds,
        pageConstraint,
        versionName: versionName || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors([data.message || "Generation failed"]);
      return;
    }
    const data = await res.json();
    setPreview(data.previewHtml);
    setWarnings(data.warnings ?? []);
    setErrors(data.errors ?? []);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Card>
          <CardTitle>Selection</CardTitle>
          <div className="mt-3 space-y-4 text-sm">
            <Group
              label="Experience"
              options={experiences}
              selected={expIds}
              onToggle={(id) => toggle(expIds, id, setExpIds)}
            />
            <Group
              label="Projects"
              options={projects}
              selected={projIds}
              onToggle={(id) => toggle(projIds, id, setProjIds)}
            />
            <Group
              label="GitHub repos"
              options={repos}
              selected={repoIds}
              onToggle={(id) => toggle(repoIds, id, setRepoIds)}
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Settings</CardTitle>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <Label>Page constraint</Label>
              <div className="flex gap-3">
                {(["one_page", "two_page"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={pageConstraint === v}
                      onChange={() => setPageConstraint(v)}
                    />
                    {v === "one_page" ? "One page" : "Two pages"}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Version name (optional)</Label>
              <input
                className="input"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="v1 — strong backend emphasis"
              />
            </div>
            <Button onClick={generate} disabled={loading} className="w-full">
              {loading ? "Generating…" : "Generate resume"}
            </Button>
          </div>
        </Card>

        {errors.length ? (
          <Card>
            <CardTitle>Validation issues</CardTitle>
            <ul className="mt-2 text-sm list-disc pl-5 text-red-700 space-y-1">
              {errors.map((e, i) => (<li key={i}>{e}</li>))}
            </ul>
          </Card>
        ) : null}

        {warnings.length ? (
          <Card>
            <CardTitle>Warnings</CardTitle>
            <ul className="mt-2 text-sm list-disc pl-5 text-amber-800 space-y-1">
              {warnings.map((w, i) => (<li key={i}>{w}</li>))}
            </ul>
          </Card>
        ) : null}

        {versions.length ? (
          <Card>
            <CardTitle>Saved versions</CardTitle>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {versions.map((v) => (
                <li key={v.id} className="py-2 flex items-center justify-between">
                  <span className="truncate">
                    {v.versionName ?? v.title}
                    <span className="muted"> · {new Date(v.createdAt).toLocaleString()}</span>
                  </span>
                  <a className="btn-ghost" href={`/api/resumes/${v.resumeId}/preview`} target="_blank">
                    Open preview
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      <div>
        {preview ? (
          <>
            <ResumePreviewFrame html={preview} />
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => window.print()}
                className="btn-outline text-sm"
              >
                Print / Save as PDF
              </button>
            </div>
          </>
        ) : (
          <Card>
            <CardTitle>Preview</CardTitle>
            <p className="muted text-sm mt-2">
              Your tailored resume preview appears here after generation.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function Group({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {options.length === 0 ? (
        <div className="muted">Nothing to select yet.</div>
      ) : (
        <div className="space-y-1">
          {options.map((o) => (
            <label key={o.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={() => onToggle(o.id)}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
