"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type UploadStage =
  | "idle"
  | "uploading"
  | "queued"
  | "extracting_text"
  | "parsing_resume"
  | "applying_profile"
  | "completed"
  | "failed";

type UploadTracker = {
  uploadId: string | null;
  fileName: string;
  stage: UploadStage;
  uploadProgress: number;
  errorMessage: string | null;
};

const STAGE_ORDER: UploadStage[] = [
  "uploading",
  "queued",
  "extracting_text",
  "parsing_resume",
  "applying_profile",
  "completed",
];

const INITIAL_TRACKER: UploadTracker = {
  uploadId: null,
  fileName: "",
  stage: "idle",
  uploadProgress: 0,
  errorMessage: null,
};

export function ResumeUploader() {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [apply, setApply] = useState(true);
  const [tracker, setTracker] = useState<UploadTracker>(INITIAL_TRACKER);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearTimeout(pollRef.current);
      }
    };
  }, []);

  const isBusy = tracker.stage !== "idle" && tracker.stage !== "completed" && tracker.stage !== "failed";

  async function onUpload() {
    if (!file || isBusy) return;

    setTracker({
      uploadId: null,
      fileName: file.name,
      stage: "uploading",
      uploadProgress: 0,
      errorMessage: null,
    });

    try {
      const started = await uploadFileWithProgress(file, apply, (progress) => {
        setTracker((current) => ({
          ...current,
          stage: "uploading",
          uploadProgress: progress,
        }));
      });

      setTracker((current) => ({
        ...current,
        uploadId: started.uploadId,
        stage: normalizeStage(started.parseStatus),
        uploadProgress: 100,
        errorMessage: null,
      }));

      await pollUntilFinished(started.uploadId, apply);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      setTracker((current) => ({
        ...current,
        stage: "failed",
        errorMessage: message,
      }));
      toast.error("Upload failed", message);
    }
  }

  async function pollUntilFinished(uploadId: string, applyToProfile: boolean) {
    while (true) {
      const res = await fetch(`/api/profile/resume-upload/${uploadId}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Could not read upload status.");
      }

      const stage = normalizeStage(data.parseStatus);
      setTracker((current) => ({
        ...current,
        uploadId,
        stage,
        errorMessage:
          typeof data.errorMessage === "string" ? data.errorMessage : null,
      }));

      if (stage === "completed") {
        toast.success(
          applyToProfile ? "Resume parsed and seeded" : "Parsed successfully",
          applyToProfile
            ? "Review items in the profile sections below."
            : "Your upload finished successfully."
        );
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
        return;
      }

      if (stage === "failed") {
        throw new Error(
          typeof data.errorMessage === "string" && data.errorMessage
            ? data.errorMessage
            : "Upload processing failed."
        );
      }

      await new Promise<void>((resolve) => {
        pollRef.current = window.setTimeout(resolve, 900);
      });
    }
  }

  return (
    <div className="space-y-3">
      <label
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-surface-muted/60 py-8 transition-colors",
          isBusy ? "opacity-70" : "hover:bg-surface-muted"
        )}
      >
        <Icon.Upload className="h-5 w-5 text-fg-subtle" />
        <div className="text-sm font-medium text-fg">
          {file ? file.name : "Click to choose a file"}
        </div>
        <div className="text-2xs text-fg-subtle">PDF, TXT, or MD - up to a few MB</div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
          disabled={isBusy}
        />
      </label>

      <Checkbox
        checked={apply}
        onChange={(e) => setApply(e.target.checked)}
        label={
          <span className="text-fg-muted">
            Apply parsed results to profile (marked review-needed)
          </span>
        }
        disabled={isBusy}
      />

      <Button
        onClick={onUpload}
        disabled={!file || isBusy}
        loading={tracker.stage === "uploading" && tracker.uploadProgress === 0}
        loadingText="Starting upload..."
        leftIcon={<Icon.Upload className="h-4 w-4" />}
      >
        Upload and parse
      </Button>

      {tracker.stage !== "idle" ? (
        <div className="surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-fg">
                {tracker.fileName || "Resume upload"}
              </div>
              <div className="mt-1 text-sm text-fg-muted">
                {stageDescription(tracker.stage, apply, tracker.errorMessage)}
              </div>
            </div>
            <Badge
              variant={tracker.stage === "failed" ? "danger" : tracker.stage === "completed" ? "verified" : "brand"}
            >
              {stageLabel(tracker.stage)}
            </Badge>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
            {tracker.stage === "uploading" || tracker.stage === "completed" || tracker.stage === "failed" ? (
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  tracker.stage === "failed" ? "bg-danger-500" : "bg-brand-600"
                )}
                style={{ width: `${tracker.stage === "failed" ? Math.max(tracker.uploadProgress, 12) : tracker.uploadProgress}%` }}
              />
            ) : (
              <div className="h-full w-2/5 rounded-full bg-brand-600/80 animate-pulse" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {visibleStages(apply).map((stage) => {
              const state = stageState(stage, tracker.stage);
              return (
                <span
                  key={stage}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium",
                    state === "done"
                      ? "border-success-100 bg-success-50 text-success-700"
                      : state === "active"
                        ? "border-brand-100 bg-brand-50 text-brand-700"
                        : "border-border-subtle bg-white text-fg-subtle"
                  )}
                >
                  {state === "done" ? (
                    <Icon.CheckCircle className="h-3.5 w-3.5" />
                  ) : state === "active" ? (
                    <Icon.RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Icon.Circle className="h-3.5 w-3.5" />
                  )}
                  {stageLabel(stage)}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function normalizeStage(value: unknown): UploadStage {
  if (
    value === "uploading" ||
    value === "queued" ||
    value === "extracting_text" ||
    value === "parsing_resume" ||
    value === "applying_profile" ||
    value === "completed" ||
    value === "failed"
  ) {
    return value;
  }
  return "queued";
}

function visibleStages(apply: boolean) {
  return apply ? STAGE_ORDER : STAGE_ORDER.filter((stage) => stage !== "applying_profile");
}

function stageState(stage: UploadStage, current: UploadStage) {
  if (current === "failed") {
    return STAGE_ORDER.indexOf(stage) < STAGE_ORDER.indexOf("failed" as UploadStage)
      ? "done"
      : "idle";
  }

  const currentIndex = STAGE_ORDER.indexOf(current);
  const stageIndex = STAGE_ORDER.indexOf(stage);

  if (stageIndex < currentIndex) return "done";
  if (stageIndex === currentIndex) return "active";
  return "idle";
}

function stageLabel(stage: UploadStage) {
  switch (stage) {
    case "uploading":
      return "Uploading";
    case "queued":
      return "Queued";
    case "extracting_text":
      return "Extracting text";
    case "parsing_resume":
      return "Parsing";
    case "applying_profile":
      return "Applying";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Idle";
  }
}

function stageDescription(
  stage: UploadStage,
  apply: boolean,
  errorMessage: string | null
) {
  switch (stage) {
    case "uploading":
      return "Uploading bytes from your browser to the server.";
    case "queued":
      return "Upload received. Waiting for the parser to start.";
    case "extracting_text":
      return "Reading the file and extracting resume text.";
    case "parsing_resume":
      return "Turning the extracted text into structured resume data.";
    case "applying_profile":
      return "Saving parsed items into your profile vault.";
    case "completed":
      return apply
        ? "Upload finished and your profile was updated."
        : "Upload finished and the resume was parsed successfully.";
    case "failed":
      return errorMessage || "The upload could not be processed.";
    default:
      return "";
  }
}

function uploadFileWithProgress(
  file: File,
  apply: boolean,
  onProgress: (progress: number) => void
) {
  return new Promise<{ uploadId: string; parseStatus: string }>((resolve, reject) => {
    const form = new FormData();
    form.set("file", file);
    form.set("apply", String(apply));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/profile/resume-upload");
    xhr.responseType = "json";

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.max(1, Math.min(100, Math.round((event.loaded / event.total) * 100))));
    });

    xhr.onerror = () => {
      reject(new Error("Network error while uploading the file."));
    };

    xhr.onload = () => {
      const data =
        xhr.response && typeof xhr.response === "object"
          ? xhr.response
          : safeParseJson(xhr.responseText);

      if (xhr.status >= 200 && xhr.status < 300 && data?.uploadId) {
        resolve({
          uploadId: String(data.uploadId),
          parseStatus: typeof data.parseStatus === "string" ? data.parseStatus : "queued",
        });
        return;
      }

      reject(new Error(data?.message || "Upload failed."));
    };

    xhr.send(form);
  });
}

function safeParseJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
