"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, IconButton } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea, Field, Checkbox } from "@/components/ui/input";
import { Empty } from "@/components/ui/empty";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

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
  const toast = useToast();
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
      toast.success("Experience added");
      router.refresh();
    } else {
      toast.error("Could not add experience");
    }
  }

  async function removeItem(id: string) {
    await fetch(`/api/profile/experience/${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
    toast.success("Experience removed");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardTitle>Add experience</CardTitle>
          <CardDescription className="mt-1">
            Company, role, dates, stack, and impact bullets.
          </CardDescription>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Company">
                <Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="Acme Inc." />
              </Field>
              <Field label="Title">
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Senior Engineer" />
              </Field>
            </div>
            <Field label="Location">
              <Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Remote · San Francisco" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Start">
                <Input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
              </Field>
              <Field label="End">
                <Input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} disabled={draft.isCurrent} />
              </Field>
            </div>
            <Checkbox
              checked={draft.isCurrent}
              onChange={(e) => setDraft({ ...draft, isCurrent: e.target.checked, endDate: e.target.checked ? "" : draft.endDate })}
              label="Current role"
            />
            <Field label="Tech stack" hint="Comma-separated.">
              <Input
                value={draft.techStack.join(", ")}
                onChange={(e) => setDraft({ ...draft, techStack: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Python, Postgres, AWS"
              />
            </Field>
            <Field label="Bullets" hint="One per line.">
              <Textarea
                value={draft.bullets.join("\n")}
                onChange={(e) => setDraft({ ...draft, bullets: e.target.value.split("\n") })}
                rows={5}
                placeholder="Led migration of 50M-row table with zero downtime…"
              />
            </Field>
            <div className="pt-2">
              <Button
                onClick={addItem}
                disabled={!draft.company || !draft.title}
                loading={saving}
                loadingText="Saving…"
                leftIcon={<Icon.Plus className="h-4 w-4" />}
                fullWidth
              >
                Add experience
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-3">
        {items.length === 0 ? (
          <Empty
            icon={<Icon.Briefcase className="h-4 w-4" />}
            title="No experiences yet"
            description="Add your first role on the left. Dates, tech stack, and bullets feed resume composition."
          />
        ) : (
          <div className="space-y-3">
            {items.map((e) => (
              <Card key={e.id ?? e.company + e.title}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-fg">
                      {e.title} <span className="text-fg-subtle font-normal">· {e.company}</span>
                    </div>
                    <div className="text-xs text-fg-muted mt-0.5 flex items-center flex-wrap gap-1.5">
                      <span>{formatDate(e.startDate)} — {e.isCurrent ? "Present" : formatDate(e.endDate)}</span>
                      {e.location ? <><span className="text-fg-faint">·</span><span>{e.location}</span></> : null}
                    </div>
                    {e.techStack.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {e.techStack.map((t) => (
                          <span key={t} className="chip">{t}</span>
                        ))}
                      </div>
                    ) : null}
                    {e.bullets.filter(Boolean).length ? (
                      <ul className="mt-3 text-sm text-fg space-y-1 list-disc pl-5">
                        {e.bullets.filter(Boolean).map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {e.id ? (
                    <IconButton variant="ghost" onClick={() => removeItem(e.id!)} aria-label="Remove experience">
                      <Icon.Trash className="h-4 w-4 text-fg-subtle" />
                    </IconButton>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(s: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
