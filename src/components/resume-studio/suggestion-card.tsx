"use client";
import type { ResumeSuggestion } from "@/schemas/resume-studio";

const SECTION_LABEL: Record<ResumeSuggestion["section"], string> = {
  summary: "Summary",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  education: "Education",
  contact: "Contact",
};

export function SuggestionCard({
  suggestion,
  onApprove,
  onReject,
}: {
  suggestion: ResumeSuggestion;
  onApprove: () => void;
  onReject: () => void;
}) {
  const confPct = Math.round((suggestion.confidence ?? 0) * 100);
  return (
    <div className="rounded-md border border-[#242a35] bg-[#10141b] text-[#e5e7eb] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#242a35] bg-[#0c1016]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] uppercase tracking-wider text-[#9ca3af] truncate">
            {SECTION_LABEL[suggestion.section]}
          </span>
          <span className="text-[10px] text-[#6b7280] truncate" title={suggestion.fieldPath}>
            {suggestion.fieldPath}
          </span>
        </div>
        {confPct > 0 ? (
          <span className="text-[10px] text-[#6b7280] shrink-0">{confPct}%</span>
        ) : null}
      </div>
      <div className="px-3 py-2.5 space-y-2 text-xs leading-relaxed">
        {suggestion.before ? (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1">Before</div>
            <div className="rounded border border-[#3a1d1d] bg-[#2a1212]/50 px-2 py-1.5 text-[#fca5a5] whitespace-pre-wrap">
              <span className="line-through decoration-[#7c2d2d]/60">{suggestion.before}</span>
            </div>
          </div>
        ) : null}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1">After</div>
          <div className="rounded border border-[#1d3a2a] bg-[#0e2a1c]/60 px-2 py-1.5 text-[#86efac] whitespace-pre-wrap">
            {suggestion.after}
          </div>
        </div>
        {suggestion.reason ? (
          <div className="text-[#9ca3af] italic text-[11px]">
            {suggestion.reason}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-[#242a35] bg-[#0c1016]">
        <button
          onClick={onReject}
          className="px-2.5 h-7 rounded text-xs font-medium border border-[#242a35] text-[#e5e7eb] hover:bg-[#1a2030] transition-colors"
        >
          Reject
        </button>
        <button
          onClick={onApprove}
          className="px-2.5 h-7 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
        >
          Approve
        </button>
      </div>
    </div>
  );
}
