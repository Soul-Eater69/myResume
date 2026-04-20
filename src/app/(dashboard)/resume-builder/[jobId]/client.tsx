"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Checkbox, Radio } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Empty } from "@/components/ui/empty";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
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
  versions: {
    id: string;
    resumeId: string;
    title: string;
    versionName: string | null;
    createdAt: string;
  }[];
}) {
  const router = useRouter();
  const toast = useToast();
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
      const msg = data.message || "Generation failed";
      setErrors([msg]);
      toast.error("Could not generate", msg);
      return;
    }
    const data = await res.json();
    setPreview(data.previewHtml);
    setWarnings(data.warnings ?? []);
    setErrors(data.errors ?? []);
    toast.success("Resume generated", "Review the preview and save it as a version.");
    router.refresh();
  }

  const totalSelected = expIds.length + projIds.length + repoIds.length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Selection</CardTitle>
              <CardDescription className="mt-1">
                Pick the evidence to include. Verified items are prioritized.
              </CardDescription>
            </div>
            <span className="text-xs text-fg-muted">{totalSelected} selected</span>
          </div>
          <div className="mt-4 space-y-5">
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
          <div className="mt-3 space-y-4">
            <Field label="Page constraint">
              <div className="flex gap-4">
                <Radio
                  label="One page"
                  name="page"
                  checked={pageConstraint === "one_page"}
                  onChange={() => setPageConstraint("one_page")}
                />
                <Radio
                  label="Two pages"
                  name="page"
                  checked={pageConstraint === "two_page"}
                  onChange={() => setPageConstraint("two_page")}
                />
              </div>
            </Field>
            <Field label="Version name" hint="Helpful when saving multiple variants.">
              <Input
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="v1 — strong backend emphasis"
              />
            </Field>
            <Button
              onClick={generate}
              loading={loading}
              loadingText="Generating…"
              leftIcon={<Icon.Sparkles className="h-4 w-4" />}
              fullWidth
            >
              Generate resume
            </Button>
          </div>
        </Card>

        {errors.length ? (
          <Alert variant="danger" title="Validation issues">
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {errors.map((e, i) => (<li key={i}>{e}</li>))}
            </ul>
          </Alert>
        ) : null}

        {warnings.length ? (
          <Alert variant="warning" title="Warnings">
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {warnings.map((w, i) => (<li key={i}>{w}</li>))}
            </ul>
          </Alert>
        ) : null}

        {versions.length ? (
          <Card padding="sm">
            <div className="px-2 py-1">
              <CardTitle>Saved versions</CardTitle>
              <CardDescription className="mt-0.5">
                {versions.length} {versions.length === 1 ? "version" : "versions"} for this job.
              </CardDescription>
            </div>
            <ul className="mt-2 divide-y divide-border-subtle">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="py-2.5 px-2 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-fg truncate">
                      {v.versionName ?? v.title}
                    </div>
                    <div className="text-xs text-fg-subtle">
                      {new Date(v.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <a
                    className="btn btn-ghost btn-sm"
                    href={`/api/resumes/${v.resumeId}/preview`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon.ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      <div className="xl:sticky xl:top-4 self-start">
        {preview ? (
          <>
            <ResumePreviewFrame html={preview} />
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Icon.Download className="h-3.5 w-3.5" />}
              >
                Print / Save as PDF
              </Button>
            </div>
          </>
        ) : (
          <Empty
            icon={<Icon.FileText className="h-5 w-5" />}
            title="Preview appears here"
            description="Select the experience, projects, and repos you want to include, then click Generate."
          />
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
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-xs font-medium uppercase tracking-wider text-fg-muted">
          {label}
        </div>
        <span className="text-2xs text-fg-subtle">
          {selected.length}/{options.length}
        </span>
      </div>
      {options.length === 0 ? (
        <div className="text-sm text-fg-subtle px-3 py-2 rounded-md bg-surface-subtle border border-border-subtle">
          Nothing to select yet.
        </div>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {options.map((o) => (
            <Checkbox
              key={o.id}
              label={o.label}
              checked={selected.includes(o.id)}
              onChange={() => onToggle(o.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
