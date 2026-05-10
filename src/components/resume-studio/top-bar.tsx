"use client";
import Link from "next/link";
import { useStudio } from "./store";

export function StudioTopBar() {
  const { state, actions } = useStudio();

  async function save(saveAsNewVersion: boolean) {
    if (state.isSaving) return;
    actions.setSaving(true);
    try {
      const res = await fetch("/api/resume-studio/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: state.resumeId,
          resume: state.resume,
          saveAsNewVersion,
          versionName: saveAsNewVersion ? `studio-${new Date().toISOString().slice(0, 16)}` : undefined,
        }),
      });
      if (!res.ok) {
        actions.setSaving(false);
        return;
      }
      const data = await res.json();
      actions.markSaved(data.updatedAt ?? new Date().toISOString());
    } catch {
      actions.setSaving(false);
    }
  }

  function exportPdf() {
    if (typeof window === "undefined") return;
    window.print();
  }

  return (
    <header className="h-12 shrink-0 border-b border-[#242a35] bg-[#0a0d12] flex items-center justify-between px-4 print:hidden">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="h-7 w-7 inline-flex items-center justify-center rounded text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1a2030]"
          title="Back to dashboard"
        >
          <Back />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded bg-emerald-600 text-white inline-flex items-center justify-center text-[10px] font-bold">
            R
          </div>
          <input
            value={state.title}
            onChange={(e) => actions.setTitle(e.target.value)}
            className="bg-transparent text-sm font-medium text-[#e5e7eb] focus:outline-none min-w-0 max-w-[280px]"
          />
          <SaveStatus
            saving={state.isSaving}
            dirty={state.isDirty}
            lastSavedAt={state.lastSavedAt}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => save(false)}
          disabled={state.isSaving || !state.isDirty}
          className="h-7 px-2.5 text-[11px] font-medium rounded border border-[#242a35] text-[#e5e7eb] hover:bg-[#1a2030] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state.isSaving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => save(true)}
          disabled={state.isSaving}
          className="h-7 px-2.5 text-[11px] font-medium rounded border border-[#242a35] text-[#e5e7eb] hover:bg-[#1a2030] disabled:opacity-50"
          title="Save and create a new version snapshot"
        >
          Save version
        </button>
        <button
          onClick={exportPdf}
          className="h-7 px-2.5 text-[11px] font-medium rounded bg-emerald-600 text-white hover:bg-emerald-500"
          title="Open the browser print dialog — pick 'Save as PDF'"
        >
          Export PDF
        </button>
      </div>
    </header>
  );
}

function SaveStatus({
  saving,
  dirty,
  lastSavedAt,
}: {
  saving: boolean;
  dirty: boolean;
  lastSavedAt: string | null;
}) {
  if (saving) return <span className="text-[10px] text-[#9ca3af]">Saving…</span>;
  if (dirty) return <span className="text-[10px] text-amber-400">Unsaved changes</span>;
  if (lastSavedAt) {
    return (
      <span className="text-[10px] text-emerald-400" title={lastSavedAt}>
        Saved
      </span>
    );
  }
  return null;
}

function Back() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}
