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

function ExperienceForm({
  value,
  onChange,
}: {
  value: Experience;
  onChange: (v: Experience) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Company">
          <Input
            value={value.company}
            onChange={(e) => onChange({ ...value, company: e.target.value })}
            placeholder="Acme Inc."
          />
        </Field>
        <Field label="Title">
          <Input
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="Senior Engineer"
          />
        </Field>
      </div>
      <Field label="Location">
        <Input
          value={value.location}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
          placeholder="Remote · San Francisco"
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Start">
          <Input
            type="date"
            value={value.startDate}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
          />
        </Field>
        <Field label="End">
          <Input
            type="date"
            value={value.endDate}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
            disabled={value.isCurrent}
          />
        </Field>
      </div>
      <Checkbox
        checked={value.isCurrent}
        onChange={(e) =>
          onChange({ ...value, isCurrent: e.target.checked, endDate: e.target.checked ? "" : value.endDate })
        }
        label="Current role"
      />
      <Field label="Tech stack" hint="Comma-separated.">
        <Input
          value={value.techStack.join(", ")}
          onChange={(e) =>
            onChange({
              ...value,
              techStack: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Python, Postgres, AWS"
        />
      </Field>
      <Field label="Bullets" hint="One per line.">
        <Textarea
          value={value.bullets.join("\n")}
          onChange={(e) => onChange({ ...value, bullets: e.target.value.split("\n") })}
          rows={5}
          placeholder="Led migration of 50M-row table with zero downtime…"
        />
      </Field>
    </div>
  );
}

function ExperienceCard({
  item,
  onRemove,
  onUpdate,
}: {
  item: Experience;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updated: Experience) => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Experience>(item);
  const [saving, setSaving] = useState(false);
  const [improving, setImproving] = useState(false);
  const [suggestedBullets, setSuggestedBullets] = useState<string[] | null>(null);

  async function saveEdit() {
    if (!item.id) return;
    setSaving(true);
    const payload = {
      company: editDraft.company,
      title: editDraft.title,
      location: editDraft.location || null,
      startDate: editDraft.startDate || null,
      endDate: editDraft.endDate || null,
      isCurrent: editDraft.isCurrent,
      techStack: editDraft.techStack,
      bullets: editDraft.bullets.filter((b) => b.trim().length > 0),
    };
    const res = await fetch(`/api/profile/experience/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      onUpdate(item.id, { ...editDraft, bullets: payload.bullets });
      setEditing(false);
      toast.success("Experience updated");
    } else {
      toast.error("Could not save changes");
    }
  }

  async function improveBullets() {
    if (!item.id) return;
    setImproving(true);
    const res = await fetch(`/api/profile/experience/${item.id}/improve-bullets`, {
      method: "POST",
    });
    setImproving(false);
    if (!res.ok) {
      toast.error("Could not improve bullets");
      return;
    }
    const data = await res.json();
    if (!data.improved) {
      toast.info("No AI provider", "Configure an AI key in Settings to enable AI rewrites.");
      return;
    }
    setSuggestedBullets(data.bullets);
  }

  function acceptSuggested() {
    if (!suggestedBullets) return;
    setEditDraft((d) => ({ ...d, bullets: suggestedBullets }));
    setSuggestedBullets(null);
    if (!editing) setEditing(true);
    toast.success("Suggestions applied — save when ready");
  }

  if (editing) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Edit experience</CardTitle>
          <IconButton
            variant="ghost"
            onClick={() => { setEditing(false); setEditDraft(item); setSuggestedBullets(null); }}
            aria-label="Cancel edit"
          >
            <Icon.X className="h-4 w-4 text-fg-subtle" />
          </IconButton>
        </div>
        <ExperienceForm value={editDraft} onChange={setEditDraft} />
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button
            onClick={saveEdit}
            disabled={!editDraft.company || !editDraft.title}
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-fg">
            {item.title}{" "}
            <span className="text-fg-subtle font-normal">· {item.company}</span>
          </div>
          <div className="text-xs text-fg-muted mt-0.5 flex items-center flex-wrap gap-1.5">
            <span>
              {formatDate(item.startDate)} —{" "}
              {item.isCurrent ? "Present" : formatDate(item.endDate)}
            </span>
            {item.location ? (
              <>
                <span className="text-fg-faint">·</span>
                <span>{item.location}</span>
              </>
            ) : null}
          </div>
          {item.techStack.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.techStack.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          {item.bullets.filter(Boolean).length ? (
            <ul className="mt-3 text-sm text-fg space-y-1 list-disc pl-5">
              {item.bullets.filter(Boolean).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          ) : null}

          {suggestedBullets ? (
            <div className="mt-3 rounded-md border border-brand-200 bg-brand-50 p-3">
              <div className="text-xs font-medium text-brand-700 uppercase tracking-wide mb-2">
                AI suggested bullets
              </div>
              <ul className="text-sm text-fg space-y-1 list-disc pl-5">
                {suggestedBullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
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
              <IconButton variant="ghost" onClick={() => { setEditDraft(item); setEditing(true); }} aria-label="Edit experience">
                <Icon.Pencil className="h-4 w-4 text-fg-subtle" />
              </IconButton>
              <IconButton variant="ghost" onClick={() => onRemove(item.id!)} aria-label="Remove experience">
                <Icon.Trash className="h-4 w-4 text-fg-subtle" />
              </IconButton>
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

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
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Experience removed");
    router.refresh();
  }

  function updateItem(id: string, updated: Experience) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...updated, id } : i)));
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
          <div className="mt-4">
            <ExperienceForm value={draft} onChange={setDraft} />
            <div className="pt-4">
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
              <ExperienceCard
                key={e.id ?? e.company + e.title}
                item={e}
                onRemove={removeItem}
                onUpdate={updateItem}
              />
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
