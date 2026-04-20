"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

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
  const [items, setItems] = useState<Edu[]>(initial);
  const [draft, setDraft] = useState<Edu>(empty);

  async function add() {
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
    if (res.ok) {
      const saved = await res.json();
      setItems([{ ...draft, id: saved.id }, ...items]);
      setDraft(empty);
      router.refresh();
    }
  }

  async function remove(id: string) {
    await fetch(`/api/profile/education/${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Add education</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div>
            <Label>Institution</Label>
            <Input value={draft.institution} onChange={(e) => setDraft({ ...draft, institution: e.target.value })} />
          </div>
          <div>
            <Label>Degree</Label>
            <Input value={draft.degree} onChange={(e) => setDraft({ ...draft, degree: e.target.value })} />
          </div>
          <div>
            <Label>Field of study</Label>
            <Input value={draft.fieldOfStudy} onChange={(e) => setDraft({ ...draft, fieldOfStudy: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Start</Label>
              <Input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Button onClick={add} disabled={!draft.institution}>Add</Button>
        </div>
      </Card>

      <div className="space-y-3">
        {items.map((i) => (
          <Card key={i.id ?? i.institution}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{i.institution}</div>
                <div className="text-sm muted">
                  {i.degree}{i.fieldOfStudy ? `, ${i.fieldOfStudy}` : ""}
                </div>
                <div className="text-sm muted">{i.startDate || "—"} to {i.endDate || "—"}</div>
              </div>
              {i.id ? <Button variant="ghost" onClick={() => remove(i.id!)}>Remove</Button> : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
