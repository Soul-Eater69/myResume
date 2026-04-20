"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Empty } from "@/components/ui/empty";

type Experience = {
  id?: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  techStack: string[];
  bullets: string[];
};

const empty: Experience = {
  company: "",
  title: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  techStack: [],
  bullets: [""],
};

export function ExperienceManager({ initial }: { initial: Experience[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Experience[]>(initial);
  const [draft, setDraft] = useState<Experience>(empty);
  const [saving, setSaving] = useState(false);

  async function addItem() {
    setSaving(true);
    const payload = {
      company: draft.company,
      title: draft.title,
      location: draft.location || null,
      startDate: draft.startDate || null,
      endDate: draft.endDate || null,
      isCurrent: draft.isCurrent,
      techStack: draft.techStack,
      bullets: draft.bullets.filter((b) => b.trim().length > 0),
    };
    const res = await fetch("/api/profile/experience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      const saved = await res.json();
      setItems([{ ...draft, id: saved.id }, ...items]);
      setDraft(empty);
      router.refresh();
    }
  }

  async function removeItem(id: string) {
    await fetch(`/api/profile/experience/${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Add experience</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div>
            <Label>Company</Label>
            <Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
          </div>
          <div>
            <Label>Title</Label>
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Start</Label>
              <Input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} disabled={draft.isCurrent} />
            </div>
          </div>
        </div>
        <div className="mt-3">
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={draft.isCurrent} onChange={(e) => setDraft({ ...draft, isCurrent: e.target.checked, endDate: e.target.checked ? "" : draft.endDate })} />
            Current role
          </label>
        </div>
        <div className="mt-3">
          <Label>Tech stack (comma-separated)</Label>
          <Input
            value={draft.techStack.join(", ")}
            onChange={(e) => setDraft({ ...draft, techStack: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
          />
        </div>
        <div className="mt-3">
          <Label>Bullets (one per line)</Label>
          <Textarea
            value={draft.bullets.join("\n")}
            onChange={(e) => setDraft({ ...draft, bullets: e.target.value.split("\n") })}
          />
        </div>
        <div className="mt-3">
          <Button onClick={addItem} disabled={!draft.company || !draft.title || saving}>
            {saving ? "Saving…" : "Add experience"}
          </Button>
        </div>
      </Card>

      {items.length === 0 ? (
        <Empty title="No experiences yet" description="Add your first role above." />
      ) : (
        <div className="space-y-3">
          {items.map((e) => (
            <Card key={e.id ?? e.company + e.title}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{e.title} <span className="muted">· {e.company}</span></div>
                  <div className="text-sm muted">
                    {e.startDate || "—"} to {e.isCurrent ? "Present" : e.endDate || "—"}
                    {e.location ? ` · ${e.location}` : ""}
                  </div>
                  {e.techStack.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {e.techStack.map((t) => (
                        <span key={t} className="badge">{t}</span>
                      ))}
                    </div>
                  ) : null}
                  <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
                    {e.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
                {e.id ? (
                  <Button variant="ghost" onClick={() => removeItem(e.id!)}>Remove</Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
