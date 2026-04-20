"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { Empty } from "@/components/ui/empty";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

type Skill = { id?: string; name: string; category: string; isVerified?: boolean };

export function SkillManager({ initial }: { initial: Skill[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Skill[]>(initial);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/profile/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category: category || null }),
    });
    setSaving(false);
    if (res.ok) {
      const saved = await res.json();
      setItems([...items.filter((s) => s.name !== name), { id: saved.id, name, category, isVerified: true }]);
      setName("");
      setCategory("");
      toast.success(`Added ${name}`);
      router.refresh();
    } else {
      toast.error("Could not add skill");
    }
  }

  async function remove(id: string) {
    await fetch(`/api/profile/skills/${id}`, { method: "DELETE" });
    setItems(items.filter((s) => s.id !== id));
    router.refresh();
  }

  // Group by category
  const grouped = items.reduce<Record<string, Skill[]>>((acc, s) => {
    const key = s.category || "uncategorized";
    (acc[key] ||= []).push(s);
    return acc;
  }, {});
  const keys = Object.keys(grouped).sort();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardTitle>Add skill</CardTitle>
          <CardDescription className="mt-1">
            Skills are used for ranking and resume composition.
          </CardDescription>
          <div className="mt-4 space-y-3">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Python" />
            </Field>
            <Field label="Category" hint="e.g. language, framework, cloud, tool">
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="language" />
            </Field>
            <div className="pt-2">
              <Button
                onClick={add}
                disabled={!name.trim()}
                loading={saving}
                loadingText="Adding…"
                leftIcon={<Icon.Plus className="h-4 w-4" />}
                fullWidth
              >
                Add skill
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-3">
        {items.length === 0 ? (
          <Empty
            icon={<Icon.Sparkles className="h-4 w-4" />}
            title="No skills yet"
            description="Add your canonical skills. Each is kept separate by category."
          />
        ) : (
          <div className="space-y-3">
            {keys.map((k) => (
              <Card key={k}>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">{k}</CardTitle>
                  <span className="text-xs text-fg-subtle">{grouped[k].length}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {grouped[k].map((s) => (
                    <span
                      key={s.id ?? s.name}
                      className={`inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-md border text-xs ${
                        s.isVerified
                          ? "bg-white border-border text-fg"
                          : "bg-warning-50 border-warning-100 text-warning-700"
                      }`}
                    >
                      {s.name}
                      {s.id ? (
                        <button
                          className="ml-0.5 h-5 w-5 inline-flex items-center justify-center rounded hover:bg-surface-muted text-fg-subtle hover:text-danger-600"
                          onClick={() => remove(s.id!)}
                          aria-label={`Remove ${s.name}`}
                        >
                          <Icon.X className="h-3 w-3" />
                        </button>
                      ) : null}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
