"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";

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
  const [items, setItems] = useState<Project[]>(initial);
  const [draft, setDraft] = useState<Project>(empty);

  async function add() {
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
    if (res.ok) {
      const saved = await res.json();
      setItems([{ ...draft, id: saved.id, isVerified: true }, ...items]);
      setDraft(empty);
      router.refresh();
    }
  }

  async function verify(id: string) {
    await fetch(`/api/profile/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: true }),
    });
    setItems(items.map((p) => (p.id === id ? { ...p, isVerified: true } : p)));
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/profile/projects/${id}`, { method: "DELETE" });
    setItems(items.filter((p) => p.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Add project</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div>
            <Label>Title</Label>
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div>
            <Label>Repo URL</Label>
            <Input value={draft.repoUrl} onChange={(e) => setDraft({ ...draft, repoUrl: e.target.value })} />
          </div>
          <div>
            <Label>Live URL</Label>
            <Input value={draft.liveUrl} onChange={(e) => setDraft({ ...draft, liveUrl: e.target.value })} />
          </div>
          <div>
            <Label>Tech stack (comma-separated)</Label>
            <Input
              value={draft.techStack.join(", ")}
              onChange={(e) => setDraft({ ...draft, techStack: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            />
          </div>
        </div>
        <div className="mt-3">
          <Label>Description</Label>
          <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </div>
        <div className="mt-3">
          <Label>Bullets (one per line)</Label>
          <Textarea
            value={draft.bullets.join("\n")}
            onChange={(e) => setDraft({ ...draft, bullets: e.target.value.split("\n") })}
          />
        </div>
        <div className="mt-3">
          <Button onClick={add} disabled={!draft.title}>Add project</Button>
        </div>
      </Card>

      {items.length === 0 ? (
        <Empty title="No projects yet" description="Add a project above or import one from GitHub." />
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <Card key={p.id ?? p.title}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.title}</span>
                    {p.isVerified ? <Badge variant="verified">verified</Badge> : <Badge variant="review">review</Badge>}
                    {p.sourceType && p.sourceType !== "manual" ? <Badge>from {p.sourceType}</Badge> : null}
                  </div>
                  {p.description ? <div className="text-sm muted mt-1">{p.description}</div> : null}
                  <div className="text-sm mt-1 flex flex-wrap gap-3">
                    {p.repoUrl ? <a className="text-brand-700" href={p.repoUrl}>repo</a> : null}
                    {p.liveUrl ? <a className="text-brand-700" href={p.liveUrl}>live</a> : null}
                  </div>
                  {p.techStack.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.techStack.map((t) => (
                        <span key={t} className="badge">{t}</span>
                      ))}
                    </div>
                  ) : null}
                  <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
                    {p.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {p.id && !p.isVerified ? <Button variant="outline" onClick={() => verify(p.id!)}>Mark verified</Button> : null}
                  {p.id ? <Button variant="ghost" onClick={() => remove(p.id!)}>Remove</Button> : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
