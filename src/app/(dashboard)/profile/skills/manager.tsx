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
type Suggestion = { name: string; category: string };

function SkillChip({
  skill,
  onRemove,
  onSave,
}: {
  skill: Skill;
  onRemove: (id: string) => void;
  onSave: (id: string, name: string, category: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(skill.name);
  const [category, setCategory] = useState(skill.category);

  function commit() {
    if (!name.trim()) { setEditing(false); setName(skill.name); setCategory(skill.category); return; }
    onSave(skill.id!, name.trim(), category.trim());
    setEditing(false);
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-brand-300 bg-brand-50 px-2 py-1 text-xs">
        <input
          autoFocus
          className="w-24 bg-transparent outline-none text-fg"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setName(skill.name); setCategory(skill.category); } }}
        />
        <span className="text-fg-faint">/</span>
        <input
          className="w-20 bg-transparent outline-none text-fg-muted"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setName(skill.name); setCategory(skill.category); } }}
          placeholder="category"
        />
        <button onClick={commit} className="ml-0.5 h-5 w-5 inline-flex items-center justify-center rounded hover:bg-brand-100 text-brand-700">
          <Icon.Check className="h-3 w-3" />
        </button>
        <button onClick={() => { setEditing(false); setName(skill.name); setCategory(skill.category); }} className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-surface-muted text-fg-subtle">
          <Icon.X className="h-3 w-3" />
        </button>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-md border text-xs cursor-pointer group ${
        skill.isVerified
          ? "bg-white border-border text-fg hover:border-brand-300 hover:bg-brand-50"
          : "bg-warning-50 border-warning-100 text-warning-700"
      }`}
    >
      <span onClick={() => setEditing(true)}>{skill.name}</span>
      {skill.id ? (
        <button
          className="ml-0.5 h-5 w-5 inline-flex items-center justify-center rounded hover:bg-surface-muted text-fg-subtle hover:text-danger-600 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onRemove(skill.id!)}
          aria-label={`Remove ${skill.name}`}
        >
          <Icon.X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}

export function SkillManager({ initial }: { initial: Skill[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Skill[]>(initial);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/profile/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), category: category.trim() || null }),
    });
    setSaving(false);
    if (res.ok) {
      const saved = await res.json();
      setItems((prev) => [...prev.filter((s) => s.name.toLowerCase() !== name.trim().toLowerCase()), { id: saved.id, name: name.trim(), category: category.trim(), isVerified: true }]);
      setName("");
      setCategory("");
      toast.success(`Added ${name.trim()}`);
      router.refresh();
    } else {
      toast.error("Could not add skill");
    }
  }

  async function remove(id: string) {
    await fetch(`/api/profile/skills/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  async function saveEdit(id: string, newName: string, newCategory: string) {
    const res = await fetch(`/api/profile/skills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, category: newCategory || null }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((s) => s.id === id ? { ...s, name: newName, category: newCategory } : s));
      toast.success("Skill updated");
      router.refresh();
    } else {
      toast.error("Could not update skill");
    }
  }

  async function getSuggestions() {
    setSuggesting(true);
    const res = await fetch("/api/profile/skills/suggest", { method: "POST" });
    setSuggesting(false);
    if (!res.ok) { toast.error("Could not fetch suggestions"); return; }
    const data = await res.json();
    if (!data.improved) {
      toast.info("No AI provider", "Configure an AI key in Settings to enable skill suggestions.");
      return;
    }
    if (data.suggestions.length === 0) {
      toast.info("Nothing to suggest", "Your skill set looks comprehensive already.");
      return;
    }
    setSuggestions(data.suggestions);
  }

  async function acceptSuggestion(s: Suggestion) {
    const res = await fetch("/api/profile/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: s.name, category: s.category || null }),
    });
    if (res.ok) {
      const saved = await res.json();
      setItems((prev) => [...prev, { id: saved.id, name: s.name, category: s.category, isVerified: true }]);
      setSuggestions((prev) => prev.filter((x) => x.name !== s.name));
      router.refresh();
    }
  }

  const grouped = items.reduce<Record<string, Skill[]>>((acc, s) => {
    const key = s.category || "uncategorized";
    (acc[key] ||= []).push(s);
    return acc;
  }, {});
  const keys = Object.keys(grouped).sort();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start space-y-4">
        <Card>
          <CardTitle>Add skill</CardTitle>
          <CardDescription className="mt-1">
            Skills are used for ranking and resume composition.
          </CardDescription>
          <div className="mt-4 space-y-3">
            <Field label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") add(); }}
                placeholder="Python"
              />
            </Field>
            <Field label="Category" hint="language, framework, cloud, tool, database…">
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") add(); }}
                placeholder="language"
              />
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

        {items.length >= 3 ? (
          <Card>
            <CardTitle>AI suggestions</CardTitle>
            <CardDescription className="mt-1">
              Suggest adjacent skills based on your current set.
            </CardDescription>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={getSuggestions}
                loading={suggesting}
                loadingText="Thinking…"
                leftIcon={<Icon.Sparkles className="h-3.5 w-3.5" />}
                fullWidth
              >
                Suggest missing skills
              </Button>
            </div>

            {suggestions.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                {suggestions.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface-subtle px-3 py-2"
                  >
                    <div>
                      <span className="text-sm text-fg">{s.name}</span>
                      {s.category ? (
                        <span className="ml-1.5 text-xs text-fg-muted">{s.category}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => acceptSuggestion(s)}
                        className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-brand-100 text-brand-700"
                        aria-label={`Add ${s.name}`}
                      >
                        <Icon.Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setSuggestions((prev) => prev.filter((x) => x.name !== s.name))}
                        className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-surface-muted text-fg-subtle"
                        aria-label={`Dismiss ${s.name}`}
                      >
                        <Icon.X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        ) : null}
      </div>

      <div className="lg:col-span-3">
        {items.length === 0 ? (
          <Empty
            icon={<Icon.Sparkles className="h-4 w-4" />}
            title="No skills yet"
            description="Add your first skill on the left. Click any chip to rename or recategorize."
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-fg-subtle">Click a skill chip to rename or recategorize it.</p>
            {keys.map((k) => (
              <Card key={k}>
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="capitalize">{k}</CardTitle>
                  <span className="text-xs text-fg-subtle">{grouped[k].length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {grouped[k].map((s) => (
                    <SkillChip key={s.id ?? s.name} skill={s} onRemove={remove} onSave={saveEdit} />
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
