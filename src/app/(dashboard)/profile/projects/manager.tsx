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

  async function verify(id: string) {
    const res = await fetch(`/api/profile/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: true }),
    });
    if (res.ok) {
      setItems(items.map((p) => (p.id === id ? { ...p, isVerified: true } : p)));
      toast.success("Marked verified");
      router.refresh();
    }
  }

  async function remove(id: string) {
    await fetch(`/api/profile/projects/${id}`, { method: "DELETE" });
    setItems(items.filter((p) => p.id !== id));
    toast.success("Removed");
    router.refresh();
  }

  const reviewCount = items.filter((p) => !p.isVerified).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardTitle>Add project</CardTitle>
          <CardDescription className="mt-1">
            Manually added projects are verified by default.
          </CardDescription>
          <div className="mt-4 space-y-3">
            <Field label="Title">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Project name" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Repo URL">
                <Input value={draft.repoUrl} onChange={(e) => setDraft({ ...draft, repoUrl: e.target.value })} placeholder="https://github.com/..." />
              </Field>
              <Field label="Live URL">
                <Input value={draft.liveUrl} onChange={(e) => setDraft({ ...draft, liveUrl: e.target.value })} placeholder="https://..." />
              </Field>
            </div>
            <Field label="Tech stack" hint="Comma-separated.">
              <Input
                value={draft.techStack.join(", ")}
                onChange={(e) => setDraft({ ...draft, techStack: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Next.js, Postgres, Redis"
              />
            </Field>
            <Field label="Description">
              <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={3} />
            </Field>
            <Field label="Bullets" hint="One per line.">
              <Textarea
                value={draft.bullets.join("\n")}
                onChange={(e) => setDraft({ ...draft, bullets: e.target.value.split("\n") })}
                rows={4}
              />
            </Field>
            <div className="pt-2">
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
                  filter === k
                    ? "bg-brand-50 text-brand-700"
                    : "text-fg-muted hover:text-fg"
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
          <div className="text-xs text-fg-subtle">{filtered.length} project{filtered.length === 1 ? "" : "s"}</div>
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
              <Card key={p.id ?? p.title}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-fg">{p.title}</span>
                      {p.isVerified ? (
                        <Badge variant="verified" leftIcon={<Icon.CheckCircle className="h-3 w-3" />}>verified</Badge>
                      ) : (
                        <Badge variant="review" leftIcon={<Icon.Circle className="h-3 w-3" />}>review needed</Badge>
                      )}
                      {p.sourceType && p.sourceType !== "manual" ? (
                        <Badge leftIcon={<Icon.Github className="h-3 w-3" />}>from {p.sourceType}</Badge>
                      ) : null}
                    </div>
                    {p.description ? (
                      <div className="text-sm text-fg-muted mt-1.5">{p.description}</div>
                    ) : null}
                    <div className="text-xs mt-2 flex flex-wrap gap-3">
                      {p.repoUrl ? (
                        <a className="text-brand-700 inline-flex items-center gap-1 hover:text-brand-800" href={p.repoUrl} target="_blank" rel="noreferrer">
                          <Icon.Github className="h-3 w-3" /> repo
                        </a>
                      ) : null}
                      {p.liveUrl ? (
                        <a className="text-brand-700 inline-flex items-center gap-1 hover:text-brand-800" href={p.liveUrl} target="_blank" rel="noreferrer">
                          <Icon.ExternalLink className="h-3 w-3" /> live
                        </a>
                      ) : null}
                    </div>
                    {p.techStack.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.techStack.map((t) => (
                          <span key={t} className="chip">{t}</span>
                        ))}
                      </div>
                    ) : null}
                    {p.bullets.filter(Boolean).length ? (
                      <ul className="mt-3 text-sm text-fg space-y-1 list-disc pl-5">
                        {p.bullets.filter(Boolean).map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {p.id && !p.isVerified ? (
                      <Button size="sm" variant="outline" onClick={() => verify(p.id!)} leftIcon={<Icon.Check className="h-3.5 w-3.5" />}>
                        Verify
                      </Button>
                    ) : null}
                    {p.id ? (
                      <IconButton variant="ghost" onClick={() => remove(p.id!)} aria-label="Remove">
                        <Icon.Trash className="h-4 w-4 text-fg-subtle" />
                      </IconButton>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
