"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, IconButton } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { Empty } from "@/components/ui/empty";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

type Edu = {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
};

const empty: Edu = { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" };

function EduForm({ value, onChange }: { value: Edu; onChange: (v: Edu) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Institution">
        <Input
          value={value.institution}
          onChange={(e) => onChange({ ...value, institution: e.target.value })}
          placeholder="University of …"
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Degree">
          <Input
            value={value.degree}
            onChange={(e) => onChange({ ...value, degree: e.target.value })}
            placeholder="B.S."
          />
        </Field>
        <Field label="Field of study">
          <Input
            value={value.fieldOfStudy}
            onChange={(e) => onChange({ ...value, fieldOfStudy: e.target.value })}
            placeholder="Computer Science"
          />
        </Field>
      </div>
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
          />
        </Field>
      </div>
    </div>
  );
}

function EduCard({
  item,
  onRemove,
  onUpdate,
}: {
  item: Edu;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updated: Edu) => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Edu>(item);
  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    if (!item.id) return;
    setSaving(true);
    const res = await fetch(`/api/profile/education/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institution: editDraft.institution,
        degree: editDraft.degree || null,
        fieldOfStudy: editDraft.fieldOfStudy || null,
        startDate: editDraft.startDate || null,
        endDate: editDraft.endDate || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      onUpdate(item.id, editDraft);
      setEditing(false);
      toast.success("Education updated");
    } else {
      toast.error("Could not save changes");
    }
  }

  if (editing) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Edit education</CardTitle>
          <IconButton
            variant="ghost"
            onClick={() => { setEditing(false); setEditDraft(item); }}
            aria-label="Cancel edit"
          >
            <Icon.X className="h-4 w-4 text-fg-subtle" />
          </IconButton>
        </div>
        <EduForm value={editDraft} onChange={setEditDraft} />
        <div className="mt-4 flex gap-2">
          <Button
            onClick={saveEdit}
            disabled={!editDraft.institution}
            loading={saving}
            loadingText="Saving…"
            leftIcon={<Icon.Check className="h-4 w-4" />}
          >
            Save changes
          </Button>
          <Button variant="outline" onClick={() => { setEditing(false); setEditDraft(item); }}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-fg">{item.institution}</div>
          <div className="text-xs text-fg-muted mt-0.5">
            {[item.degree, item.fieldOfStudy].filter(Boolean).join(", ") || "—"}
          </div>
          <div className="text-xs text-fg-subtle mt-0.5">
            {formatDate(item.startDate)} — {formatDate(item.endDate)}
          </div>
        </div>
        {item.id ? (
          <div className="flex items-center gap-1 shrink-0">
            <IconButton variant="ghost" onClick={() => { setEditDraft(item); setEditing(true); }} aria-label="Edit education">
              <Icon.Pencil className="h-4 w-4 text-fg-subtle" />
            </IconButton>
            <IconButton variant="ghost" onClick={() => onRemove(item.id!)} aria-label="Remove education">
              <Icon.Trash className="h-4 w-4 text-fg-subtle" />
            </IconButton>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function EducationManager({ initial }: { initial: Edu[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Edu[]>(initial);
  const [draft, setDraft] = useState<Edu>(empty);
  const [saving, setSaving] = useState(false);

  async function add() {
    setSaving(true);
    const res = await fetch("/api/profile/education", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institution: draft.institution,
        degree: draft.degree || null,
        fieldOfStudy: draft.fieldOfStudy || null,
        startDate: draft.startDate || null,
        endDate: draft.endDate || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const saved = await res.json();
      setItems([{ ...draft, id: saved.id }, ...items]);
      setDraft(empty);
      toast.success("Education added");
      router.refresh();
    } else {
      toast.error("Could not add education");
    }
  }

  function updateItem(id: string, updated: Edu) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...updated, id } : i)));
    router.refresh();
  }

  async function removeItem(id: string) {
    await fetch(`/api/profile/education/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Removed");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardTitle>Add education</CardTitle>
          <CardDescription className="mt-1">
            Institution, degree, field, and dates.
          </CardDescription>
          <div className="mt-4">
            <EduForm value={draft} onChange={setDraft} />
            <div className="pt-4">
              <Button
                onClick={add}
                disabled={!draft.institution}
                loading={saving}
                loadingText="Saving…"
                leftIcon={<Icon.Plus className="h-4 w-4" />}
                fullWidth
              >
                Add education
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-3">
        {items.length === 0 ? (
          <Empty
            icon={<Icon.CheckCircle className="h-4 w-4" />}
            title="No education entries"
            description="Add a degree or program on the left."
          />
        ) : (
          <div className="space-y-3">
            {items.map((i) => (
              <EduCard key={i.id ?? i.institution} item={i} onRemove={removeItem} onUpdate={updateItem} />
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
