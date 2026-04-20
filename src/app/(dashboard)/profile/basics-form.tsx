"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function ProfileBasicsForm({
  initial,
}: {
  initial: { headline: string; summary: string; targetRoles: string[] };
}) {
  const toast = useToast();
  const [headline, setHeadline] = useState(initial.headline);
  const [summary, setSummary] = useState(initial.summary);
  const [targetRolesText, setTargetRolesText] = useState(initial.targetRoles.join(", "));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/profile", {
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
    if (res.ok) toast.success("Profile saved");
    else toast.error("Could not save profile");
  }

  return (
    <div className="mt-4 space-y-4">
      <Field label="Headline">
        <Input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Senior Software Engineer"
        />
      </Field>
      <Field label="Professional summary" hint="One paragraph overview of your experience, stack, and impact.">
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Backend engineer specializing in distributed systems…"
          rows={4}
        />
      </Field>
      <Field label="Target roles" hint="Comma-separated.">
        <Input
          value={targetRolesText}
          onChange={(e) => setTargetRolesText(e.target.value)}
          placeholder="Backend Engineer, AI Engineer"
        />
      </Field>
      <div className="pt-2 border-t border-border-subtle">
        <Button onClick={save} loading={saving} loadingText="Saving…">
          Save changes
        </Button>
      </div>
    </div>
  );
}
