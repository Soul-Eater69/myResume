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

  async function remove(id: string) {
    await fetch(`/api/profile/education/${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
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
          <div className="mt-4 space-y-3">
            <Field label="Institution">
              <Input value={draft.institution} onChange={(e) => setDraft({ ...draft, institution: e.target.value })} placeholder="University of ..." />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Degree">
                <Input value={draft.degree} onChange={(e) => setDraft({ ...draft, degree: e.target.value })} placeholder="B.S." />
              </Field>
              <Field label="Field of study">
                <Input value={draft.fieldOfStudy} onChange={(e) => setDraft({ ...draft, fieldOfStudy: e.target.value })} placeholder="Computer Science" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Start">
                <Input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
              </Field>
              <Field label="End">
                <Input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
              </Field>
            </div>
            <div className="pt-2">
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
              <Card key={i.id ?? i.institution}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-fg">{i.institution}</div>
                    <div className="text-xs text-fg-muted mt-0.5">
                      {[i.degree, i.fieldOfStudy].filter(Boolean).join(", ") || "—"}
                    </div>
                    <div className="text-xs text-fg-subtle mt-0.5">
                      {formatDate(i.startDate)} — {formatDate(i.endDate)}
                    </div>
                  </div>
                  {i.id ? (
                    <IconButton variant="ghost" onClick={() => remove(i.id!)} aria-label="Remove">
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
