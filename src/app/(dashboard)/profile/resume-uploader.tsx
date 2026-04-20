"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

export function ResumeUploader() {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [apply, setApply] = useState(true);
  const [loading, setLoading] = useState(false);

  async function onUpload() {
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.set("file", file);
    form.set("apply", String(apply));
    const res = await fetch("/api/profile/resume-upload", { method: "POST", body: form });
    setLoading(false);
    if (!res.ok) {
      toast.error("Upload failed", "Try a PDF or plain-text resume.");
      return;
    }
    toast.success(
      apply ? "Resume parsed and seeded" : "Parsed successfully",
      apply ? "Review items in the profile sections below." : undefined
    );
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <label
        className="flex flex-col items-center justify-center gap-1.5 w-full rounded-md border border-dashed border-border bg-surface-muted/60 hover:bg-surface-muted cursor-pointer py-8 transition-colors"
      >
        <Icon.Upload className="h-5 w-5 text-fg-subtle" />
        <div className="text-sm font-medium text-fg">
          {file ? file.name : "Click to choose a file"}
        </div>
        <div className="text-2xs text-fg-subtle">PDF, TXT, or MD — up to a few MB</div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>
      <Checkbox
        checked={apply}
        onChange={(e) => setApply(e.target.checked)}
        label={<span className="text-fg-muted">Apply parsed results to profile (marked review-needed)</span>}
      />
      <Button
        onClick={onUpload}
        disabled={!file}
        loading={loading}
        loadingText="Parsing…"
        leftIcon={<Icon.Upload className="h-4 w-4" />}
      >
        Upload & parse
      </Button>
    </div>
  );
}
