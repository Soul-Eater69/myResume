"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Skill = { id?: string; name: string; category: string; isVerified?: boolean };

export function SkillManager({ initial }: { initial: Skill[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Skill[]>(initial);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  async function add() {
    if (!name.trim()) return;
    const res = await fetch("/api/profile/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category: category || null }),
    });
    if (res.ok) {
      const saved = await res.json();
      setItems([...items.filter((s) => s.name !== name), { id: saved.id, name, category, isVerified: true }]);
      setName("");
      setCategory("");
      router.refresh();
    }
  }

  async function remove(id: string) {
    await fetch(`/api/profile/skills/${id}`, { method: "DELETE" });
    setItems(items.filter((s) => s.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Add skill</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <div className="md:col-span-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Python" />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="language" />
          </div>
        </div>
        <div className="mt-3">
          <Button onClick={add}>Add</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Your skills</CardTitle>
        {items.length === 0 ? (
          <p className="muted text-sm mt-2">No skills yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {items.map((s) => (
              <span key={s.id ?? s.name} className="inline-flex items-center gap-1">
                <Badge variant={s.isVerified ? "verified" : "review"}>{s.name}</Badge>
                {s.id ? (
                  <button className="text-xs text-slate-500 hover:text-red-600" onClick={() => remove(s.id!)}>
                    ×
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
