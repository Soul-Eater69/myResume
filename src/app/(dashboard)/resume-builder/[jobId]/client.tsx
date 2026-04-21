"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Checkbox, Radio } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Empty } from "@/components/ui/empty";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { ResumePreviewFrame } from "@/components/resume/resume-preview";
import type { ResumeSuggestions } from "@/schemas/resume";

type Option = { id: string; label: string };
type Seniority =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "staff"
  | "principal"
  | "lead"
  | "unspecified";

const EMPTY_SUGGESTIONS: ResumeSuggestions = {
  projectIdeas: [],
  bulletImprovements: [],
  missingEvidence: [],
  competencyGrid: [],
  keywordCoverage: [],
  gapMitigation: [],
};

const GENERATION_STATUS_STEPS = [
  "Starting generation.",
  "Matching your selected evidence to the job description.",
  "Drafting the tailored resume.",
  "Rendering the preview.",
];

export function ResumeBuilderClient({
  jobId,
  experiences,
  projects,
  repos,
  preselectedExperienceIds,
  preselectedProjectIds,
  preselectedRepoIds,
  jobSummary,
  archetype,
  seniority,
  requiredSkills,
  preferredSkills,
  keywords,
  focusAreas,
  versions,
}: {
  jobId: string;
  experiences: Option[];
  projects: Option[];
  repos: Option[];
  preselectedExperienceIds: string[];
  preselectedProjectIds: string[];
  preselectedRepoIds: string[];
  jobSummary: string;
  archetype: string;
  seniority: Seniority;
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  focusAreas: string[];
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
  const [pageConstraint, setPageConstraint] = useState<"one_page" | "two_page">(
    "one_page"
  );
  const [versionName, setVersionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [suggestions, setSuggestions] =
    useState<ResumeSuggestions>(EMPTY_SUGGESTIONS);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const totalSelected = expIds.length + projIds.length + repoIds.length;
  const availableEvidenceCount =
    experiences.length + projects.length + repos.length;
  const hasNoAvailableEvidence = availableEvidenceCount === 0;

  useEffect(() => {
    if (!loading) {
      setStatusMessage(null);
      return;
    }

    let step = 0;
    setStatusMessage(GENERATION_STATUS_STEPS[step]);

    const interval = window.setInterval(() => {
      step = Math.min(step + 1, GENERATION_STATUS_STEPS.length - 1);
      setStatusMessage(GENERATION_STATUS_STEPS[step]);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [loading]);

  function toggle(set: string[], id: string, setter: (value: string[]) => void) {
    if (set.includes(id)) setter(set.filter((value) => value !== id));
    else setter([...set, id]);
  }

  async function generate() {
    if (totalSelected === 0) {
      const message = hasNoAvailableEvidence
        ? "Add experience, projects, or GitHub repos before generating a tailored resume."
        : "Select at least one experience, project, or repo before generating.";
      setErrors([message]);
      toast.error("Not enough evidence", message);
      return;
    }

    setLoading(true);
    setPreview(null);
    setWarnings([]);
    setErrors([]);
    setSuggestions(EMPTY_SUGGESTIONS);

    try {
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

      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof data.message === "string" ? data.message : "Generation failed";
        const issueList = Array.isArray(data.issues)
          ? data.issues
              .map((issue: { path?: (string | number)[]; message?: string }) => {
                const path = (issue.path ?? []).join(".");
                return `${path ? `${path}: ` : ""}${issue.message ?? ""}`.trim();
              })
              .filter((item: string) => item.length > 0)
          : [];
        setErrors(issueList.length ? [message, ...issueList] : [message]);
        toast.error("Could not generate", message);
        return;
      }

      const nextWarnings = toStringArray(data.warnings);
      const nextErrors = toStringArray(data.errors);
      const previewHtml =
        typeof data.previewHtml === "string" ? data.previewHtml : null;
      const experienceCount = Array.isArray(data.resume?.experience)
        ? data.resume.experience.length
        : 0;
      const projectCount = Array.isArray(data.resume?.projects)
        ? data.resume.projects.length
        : 0;

      if (experienceCount === 0 && projectCount === 0) {
        nextWarnings.unshift(
          "This draft contains little or no evidence. Add profile experience, projects, or GitHub repos to get a stronger tailored resume."
        );
      }

      setPreview(previewHtml);
      setWarnings(nextWarnings);
      setErrors(nextErrors);
      setSuggestions(normalizeSuggestions(data.resume?.suggestions));

      if (!previewHtml) {
        toast.error(
          "Preview unavailable",
          "The resume was generated, but the preview HTML was missing."
        );
        return;
      }

      toast.success(
        "Resume generated",
        "Review the preview and save it as a version."
      );
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Generation failed due to a network or server error.";
      setErrors([message]);
      toast.error("Could not generate", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Job signals</CardTitle>
              <CardDescription className="mt-1">
                Borrowed from career-ops: frame the resume around the role archetype and JD keywords.
              </CardDescription>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge variant="brand">{archetype}</Badge>
              {formatSeniority(seniority) ? (
                <Badge>{formatSeniority(seniority)}</Badge>
              ) : null}
            </div>
          </div>
          {jobSummary ? (
            <p className="mt-3 text-sm text-fg-muted">{jobSummary}</p>
          ) : null}
          <SignalRow label="Tailoring focus" items={focusAreas} variant="brand" />
          <SignalRow
            label="Required skills"
            items={requiredSkills}
            variant="verified"
          />
          <SignalRow
            label="Preferred skills"
            items={preferredSkills}
            variant="suggested"
          />
          <SignalRow label="Keywords" items={keywords.slice(0, 12)} />
        </Card>

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
          {hasNoAvailableEvidence ? (
            <Alert variant="info" title="Add profile evidence first" className="mt-4">
              <div>
                Tailored resumes need verified experience, projects, or GitHub repos.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
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
            </Alert>
          ) : null}
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
                placeholder="v1 - strong backend emphasis"
              />
            </Field>
            <Button
              onClick={generate}
              disabled={totalSelected === 0}
              loading={loading}
              loadingText="Generating..."
              leftIcon={<Icon.Sparkles className="h-4 w-4" />}
              fullWidth
            >
              Generate resume
            </Button>
            <p className="text-xs text-fg-muted">
              {totalSelected > 0
                ? "Generate uses only the items selected above."
                : hasNoAvailableEvidence
                  ? "Add profile evidence to unlock generation."
                  : "Select at least one experience, project, or repo to enable generation."}
            </p>
          </div>
        </Card>

        {loading && statusMessage ? (
          <Alert variant="info" title="Generating resume">
            <div>{statusMessage}</div>
            <div className="mt-1">Keep this tab open. The preview updates automatically when ready.</div>
          </Alert>
        ) : null}

        {errors.length ? (
          <Alert variant="danger" title="Validation issues">
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        {warnings.length ? (
          <Alert variant="warning" title="Warnings">
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        {hasSuggestions(suggestions) ? (
          <Card>
            <CardTitle>Adaptation notes</CardTitle>
            <CardDescription className="mt-1">
              Keep verified facts in the resume itself. Use these notes for refinement, gap review, or interview prep.
            </CardDescription>
            <SignalRow
              label="Competency grid"
              items={suggestions.competencyGrid}
              variant="verified"
            />
            <SignalRow
              label="ATS keywords already covered"
              items={suggestions.keywordCoverage}
              variant="brand"
            />
            <SuggestionList
              label="Missing evidence"
              items={suggestions.missingEvidence}
            />
            <SuggestionList
              label="Gap mitigation"
              items={suggestions.gapMitigation}
            />
            <SuggestionList
              label="Bullet improvements"
              items={suggestions.bulletImprovements}
            />
            <SuggestionList label="Project ideas" items={suggestions.projectIdeas} />
          </Card>
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
              {versions.map((version) => (
                <li
                  key={version.id}
                  className="flex items-center justify-between gap-3 px-2 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-fg">
                      {version.versionName ?? version.title}
                    </div>
                    <div className="text-xs text-fg-subtle">
                      {new Date(version.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <a
                    className="btn btn-ghost btn-sm"
                    href={`/api/resumes/${version.resumeId}/preview`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      <div className="self-start xl:sticky xl:top-4">
        {loading ? (
          <Empty
            icon={<Icon.RefreshCw className="h-5 w-5 animate-spin" />}
            title="Generating preview"
            description={
              statusMessage ??
              "Preparing the tailored resume preview."
            }
          />
        ) : preview ? (
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
            description={
              hasNoAvailableEvidence
                ? "Add profile experience, projects, or GitHub repos before generating a tailored resume."
                : totalSelected > 0
                  ? "Click Generate to build a tailored resume from the selected evidence."
                  : "Select the experience, projects, and repos you want to include, then click Generate."
            }
            action={
              hasNoAvailableEvidence ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <Link className="btn btn-sm btn-primary" href="/profile/experience">
                    Add experience
                  </Link>
                  <Link className="btn btn-sm btn-outline" href="/github">
                    Import GitHub
                  </Link>
                </div>
              ) : null
            }
          />
        )}
      </div>
    </div>
  );
}

function SignalRow({
  label,
  items,
  variant = "default",
}: {
  label: string;
  items: string[];
  variant?: "default" | "brand" | "verified" | "suggested";
}) {
  if (!items.length) return null;

  return (
    <div className="mt-4">
      <div className="text-xs font-medium uppercase tracking-wider text-fg-muted">
        {label}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={`${label}-${item}`} variant={variant}>
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function SuggestionList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  if (!items.length) return null;

  return (
    <div className="mt-4">
      <div className="text-xs font-medium uppercase tracking-wider text-fg-muted">
        {label}
      </div>
      <ul className="mt-2 space-y-1 text-sm text-fg-muted">
        {items.map((item) => (
          <li key={`${label}-${item}`} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-faint" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
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
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-fg-muted">
          {label}
        </div>
        <span className="text-2xs text-fg-subtle">
          {selected.length}/{options.length}
        </span>
      </div>
      {options.length === 0 ? (
        <div className="rounded-md border border-border-subtle bg-surface-subtle px-3 py-2 text-sm text-fg-subtle">
          Nothing to select yet.
        </div>
      ) : (
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {options.map((option) => (
            <Checkbox
              key={option.id}
              label={option.label}
              checked={selected.includes(option.id)}
              onChange={() => onToggle(option.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function normalizeSuggestions(input: unknown): ResumeSuggestions {
  if (!input || typeof input !== "object") return EMPTY_SUGGESTIONS;
  const source = input as Partial<Record<keyof ResumeSuggestions, unknown>>;
  return {
    projectIdeas: toStringArray(source.projectIdeas),
    bulletImprovements: toStringArray(source.bulletImprovements),
    missingEvidence: toStringArray(source.missingEvidence),
    competencyGrid: toStringArray(source.competencyGrid),
    keywordCoverage: toStringArray(source.keywordCoverage),
    gapMitigation: toStringArray(source.gapMitigation),
  };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function hasSuggestions(suggestions: ResumeSuggestions): boolean {
  return Object.values(suggestions).some((items) => items.length > 0);
}

function formatSeniority(seniority: Seniority): string | null {
  if (!seniority || seniority === "unspecified") return null;
  return seniority.charAt(0).toUpperCase() + seniority.slice(1);
}
