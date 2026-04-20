"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function NewJobForm() {
  const router = useRouter();
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
      router.push(`/jobs/${job.id}`);
      router.refresh();
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <div>
        <Label>Company</Label>
        <Input value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label>Source URL</Label>
        <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div>
        <Label>Job description</Label>
        <Textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          className="min-h-[200px]"
          placeholder="Paste the full JD here"
        />
      </div>
      <Button onClick={save} disabled={jdText.length < 20 || loading} className="w-full">
        {loading ? "Saving…" : "Save & extract"}
      </Button>
    </div>
  );
}
