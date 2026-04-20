"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

export function NewJobForm() {
  const router = useRouter();
  const toast = useToast();
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: company || null,
        title: title || null,
        sourceUrl: sourceUrl || null,
        jdText,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const job = await res.json();
      toast.success("Job saved", "Extracting hiring signals…");
      router.push(`/jobs/${job.id}`);
      router.refresh();
    } else {
      toast.error("Could not save job");
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Company">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
        </Field>
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Engineer" />
        </Field>
      </div>
      <Field label="Source URL">
        <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
      </Field>
      <Field label="Job description" hint="Paste the full JD. We extract required skills, preferred skills, domain, and seniority.">
        <Textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          className="min-h-[220px]"
          placeholder="We are hiring a Senior Engineer to build…"
        />
      </Field>
      <div className="pt-2">
        <Button
          onClick={save}
          disabled={jdText.length < 20}
          loading={loading}
          loadingText="Saving…"
          leftIcon={<Icon.Sparkles className="h-4 w-4" />}
          fullWidth
        >
          Save & extract signals
        </Button>
      </div>
    </div>
  );
}
