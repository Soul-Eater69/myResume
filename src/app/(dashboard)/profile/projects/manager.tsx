"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, IconButton } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

type Project = {
  id?: string;
  title: string;
  description: string;
  repoUrl: string;
  liveUrl: string;
  techStack: string[];
  bullets: string[];
  isVerified?: boolean;
  sourceType?: string;
};

const empty: Project = {
  title: "",
  description: "",
  repoUrl: "",
  liveUrl: "",
  techStack: [],
  bullets: [""],
};

function ProjectForm({
  value,
  onChange,
}: {
  value: Project;
  onChange: (v: Project) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Title">
        <Input
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="Project name"
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Repo URL">
          <Input
            value={value.repoUrl}
            onChange={(e) => onChange({ ...value, repoUrl: e.target.value })}
            placeholder="https://github.com/..."
          />
        </Field>
        <Field label="Live URL">
          <Input
            value={value.liveUrl}
            onChange={(e) => onChange({ ...value, liveUrl: e.target.value })}
            placeholder="https://..."
          />
        </Field>
      </div>
      <Field label="Tech stack" hint="Comma-separated.">
        <Input
          value={value.techStack.join(", ")}
          onChange={(e) =>
            onChange({
              ...value,
              techStack: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="Next.js, Postgres, Redis"
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          rows={3}
        />
      </Field>
      <Field label="Bullets" hint="One per line.">
        <Textarea
          value={value.bullets.join("\n")}
          onChange={(e) => onChange({ ...value, bullets: e.target.value.split("\n") })}
          rows={4}
        />
      </Field>
    </div>
  );
}

function ProjectCard({
  item,
  onRemove,
  onUpdate,
}: {
  item: Project;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updated: Project) => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Project>(item);
  const [saving, setSaving] = useState(false);
  const [improving, setImproving] = useState(false);
  const [suggestedBullets, setSuggestedBullets] = useState<string[] | null>(null);

  async function saveEdit() {
    if (!item.id) return;
    setSaving(true);
    const payload = {
      title: editDraft.title,
      description: editDraft.description || null,
      repoUrl: editDraft.repoUrl || null,
      liveUrl: editDraft.liveUrl || null,
      techStack: editDraft.techStack,
      bullets: editDraft.bullets.filter((b) => b.trim()),
    };
    const res = await fetch(`/api/profile/projects/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      onUpdate(item.id, { ...editDraft, bullets: payload.bullets });
      setEditing(false);
      toast.success("Project updated");
    } else {
      toast.error("Could not save changes");
    }
  }

  async function verify() {
    if (!item.id) return;
    const res = await fetch(`/api/profile/projects/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: true }),
    });
    if (res.ok) {
      onUpdate(item.id, { ...item, isVerified: true });
      toast.success("Marked as verified");
    }
  }

  async function improveBullets() {
    if (!item.id) return;
    setImproving(true);
    const res = await fetch(`/api/profile/projects/${item.id}/improve-bullets`, { method: "POST" });
    setImproving(false);
    if (!res.ok) {
      toast.error("Could not improve bullets");
      return;
    }
    const data = await res.json();
    if (!data.improved) {
      toast.info("No AI provider", "Configure an AI key in Settings to enable rewrites.");
      return;
    }
    setSuggestedBullets(data.bullets);
  }

  function acceptSuggested() {
    if (!suggestedBullets) return;
    setEditDraft((d) => ({ ...d, bullets: suggestedBullets }));
    setSuggestedBullets(null);
    setEditing(true);
    toast.success("Suggestions applied — save when ready");
  }

  if (editing) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Edit project</CardTitle>
          <IconButton
            variant="ghost"
            onClick={() => { setEditing(false); setEditDraft(item); setSuggestedBullets(null); }}
            aria-label="Cancel edit"
          >
            <Icon.X className="h-4 w-4 text-fg-subtle" />
          </IconButton>
        </div>
        <ProjectForm value={editDraft} onChange={setEditDraft} />
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button
            onClick={saveEdit}
            disabled={!editDraft.title}
            loading={saving}
            loadingText="Saving…"
            leftIcon={<Icon.Check className="h-4 w-4" />}
          >
            Save changes
          </Button>
          <Button variant="outline" onClick={() => { setEditing(false); setEditDraft(item); setSuggestedBullets(null); }}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-fg">{item.title}</span>
            {item.isVerified ? (
              <Badge variant="verified" leftIcon={<Icon.CheckCircle className="h-3 w-3" />}>verified</Badge>
            ) : (
              <Badge variant="review" leftIcon={<Icon.Circle className="h-3 w-3" />}>review needed</Badge>
            )}
            {item.sourceType && item.sourceType !== "manual" ? (
              <Badge leftIcon={<Icon.Github className="h-3 w-3" />}>from {item.sourceType}</Badge>
            ) : null}
          </div>
          {item.description ? (
            <p className="text-sm text-fg-muted mt-1.5">{item.description}</p>
          ) : null}
          <div className="text-xs mt-2 flex flex-wrap gap-3">
            {item.repoUrl ? (
              <a className="text-brand-700 inline-flex items-center gap-1 hover:text-brand-800" href={item.repoUrl} target="_blank" rel="noreferrer">
                <Icon.Github className="h-3 w-3" /> repo
              </a>
            ) : null}
            {item.liveUrl ? (
              <a className="text-brand-700 inline-flex items-center gap-1 hover:text-brand-800" href={item.liveUrl} target="_blank" rel="noreferrer">
                <Icon.ExternalLink className="h-3 w-3" /> live
              </a>
            ) : null}
          </div>
          {item.techStack.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.techStack.map((t) => <span key={t} className="chip">{t}</span>)}
            </div>
          ) : null}
          {item.bullets.filter(Boolean).length ? (
            <ul className="mt-3 text-sm text-fg space-y-1 list-disc pl-5">
              {item.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          ) : null}

          {suggestedBullets ? (
            <div className="mt-3 rounded-md border border-brand-200 bg-brand-50 p-3">
              <div className="text-xs font-medium text-brand-700 uppercase tracking-wide mb-2">
                AI suggested bullets
              </div>
              <ul className="text-sm text-fg space-y-1 list-disc pl-5">
                {suggestedBullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={acceptSuggested} leftIcon={<Icon.Check className="h-3.5 w-3.5" />}>
                  Apply suggestions
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSuggestedBullets(null)}>
                  Discard
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {item.id && !item.isVerified ? (
            <Button size="sm" variant="outline" onClick={verify} leftIcon={<Icon.Check className="h-3.5 w-3.5" />}>
              Verify
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={improveBullets}
            loading={improving}
            loadingText="Improving…"
            leftIcon={<Icon.Sparkles className="h-3.5 w-3.5" />}
          >
            AI fix
          </Button>
          {item.id ? (
            <>
              <IconButton variant="ghost" onClick={() => { setEditDraft(item); setEditing(true); }} aria-label="Edit project">
                <Icon.Pencil className="h-4 w-4 text-fg-subtle" />
              </IconButton>
              <IconButton variant="ghost" onClick={() => onRemove(item.id!)} aria-label="Remove project">
                <Icon.Trash className="h-4 w-4 text-fg-subtle" />
              </IconButton>
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function ProjectManager({ initial }: { initial: Project[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Project[]>(initial);
  const [draft, setDraft] = useState<Project>(empty);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "review" | "verified">("all");

  const filtered =
    filter === "review" ? items.filter((p) => !p.isVerified)
    : filter === "verified" ? items.filter((p) => p.isVerified)
    : items;

  const reviewCount = items.filter((p) => !p.isVerified).length;

  async function add() {
    setSaving(true);
    const res = await fetch("/api/profile/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        description: draft.description || null,
        repoUrl: draft.repoUrl || null,
        liveUrl: draft.liveUrl || null,
        techStack: draft.techStack,
        bullets: draft.bullets.filter((b) => b.trim()),
      }),
    });
    setSaving(false);
    if (res.ok) {
      const saved = await res.json();
      setItems([{ ...draft, id: saved.id, isVerified: true, sourceType: "manual" }, ...items]);
      setDraft(empty);
      toast.success("Project added");
      router.refresh();
    } else {
      toast.error("Could not add project");
    }
  }

  function updateItem(id: string, updated: Project) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...updated, id } : p)));
    router.refresh();
  }

  async function removeItem(id: string) {
    await fetch(`/api/profile/projects/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success("Project removed");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardTitle>Add project</CardTitle>
          <CardDescription className="mt-1">
            Manually added projects are verified by default.
          </CardDescription>
          <div className="mt-4">
            <ProjectForm value={draft} onChange={setDraft} />
            <div className="pt-4">
              <Button
                onClick={add}
                disabled={!draft.title}
                loading={saving}
                loadingText="Saving…"
                leftIcon={<Icon.Plus className="h-4 w-4" />}
                fullWidth
              >
                Add project
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1 bg-white border border-border rounded-md p-1 shadow-xs">
            {(["all", "review", "verified"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-2.5 h-7 rounded-sm text-xs font-medium transition-colors capitalize ${
                  filter === k ? "bg-brand-50 text-brand-700" : "text-fg-muted hover:text-fg"
                }`}
              >
                {k}
                {k === "review" && reviewCount > 0 ? (
                  <span className="ml-1 text-2xs bg-warning-100 text-warning-700 rounded-full px-1">
                    {reviewCount}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <span className="text-xs text-fg-subtle">
            {filtered.length} project{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <Empty
            icon={<Icon.FileText className="h-4 w-4" />}
            title={items.length === 0 ? "No projects yet" : "No projects match this filter"}
            description={items.length === 0 ? "Add a project on the left or import one from GitHub." : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <ProjectCard key={p.id ?? p.title} item={p} onRemove={removeItem} onUpdate={updateItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
