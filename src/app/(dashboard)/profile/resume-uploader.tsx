"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ResumeUploader() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [apply, setApply] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onUpload() {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    const form = new FormData();
    form.set("file", file);
    form.set("apply", String(apply));
    const res = await fetch("/api/profile/resume-upload", { method: "POST", body: form });
    setLoading(false);
    if (!res.ok) {
      setMessage("Upload failed. Try a PDF or plain-text resume.");
      return;
    }
    setMessage(apply ? "Parsed and seeded. Review in the profile sections below." : "Parsed successfully.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept=".pdf,.txt,.md"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={apply}
          onChange={(e) => setApply(e.target.checked)}
        />
        Apply parsed results to my profile (marked review-needed)
      </label>
      <Button onClick={onUpload} disabled={!file || loading}>
        {loading ? "Uploading…" : "Upload & parse"}
      </Button>
      {message ? <div className="text-sm muted">{message}</div> : null}
    </div>
  );
}
