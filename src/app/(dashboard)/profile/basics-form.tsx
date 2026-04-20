"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function ProfileBasicsForm({
  initial,
}: {
  initial: { headline: string; summary: string; targetRoles: string[] };
}) {
  const [headline, setHeadline] = useState(initial.headline);
  const [summary, setSummary] = useState(initial.summary);
  const [targetRolesText, setTargetRolesText] = useState(
    initial.targetRoles.join(", ")
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline,
        summary,
        targetRoles: targetRolesText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="mt-3 space-y-3">
      <div>
        <Label>Headline</Label>
        <Input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Senior Software Engineer"
        />
      </div>
      <div>
        <Label>Professional summary</Label>
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="One-paragraph overview of your experience, stack, and what you build."
        />
      </div>
      <div>
        <Label>Target roles (comma-separated)</Label>
        <Input
          value={targetRolesText}
          onChange={(e) => setTargetRolesText(e.target.value)}
          placeholder="Backend Engineer, AI Engineer"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {saved ? <span className="text-sm text-emerald-600">Saved</span> : null}
      </div>
    </div>
  );
}
