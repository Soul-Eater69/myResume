"use client";
import { useState } from "react";
import { useStudio } from "./store";
import { SuggestionCard } from "./suggestion-card";
import type { SuggestResponse } from "@/schemas/resume-studio";

const PROMPT_CHIPS = [
  "Make this ATS friendly",
  "Tailor for this job",
  "Improve bullet impact",
  "Add stronger metrics",
  "Make it sound senior",
];

export function AiAssistantPanel() {
  const { state, actions } = useStudio();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function send(text: string) {
    if (!text.trim() || state.isGenerating) return;
    setError(null);
    actions.pushUserMessage(text);
    setPrompt("");
    actions.setGenerating(true);

    try {
      const res = await fetch("/api/resume-studio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: state.resumeId,
          resume: state.resume,
          jobDescription: state.jobDescription || undefined,
          userPrompt: text,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<SuggestResponse> & {
        message?: string;
      };
      if (!res.ok) {
        const msg = data.message || "Suggestion request failed.";
        setError(msg);
        actions.addSuggestions([], msg);
        return;
      }
      actions.addSuggestions(
        data.suggestions ?? [],
        data.assistantMessage || "Drafted suggestions."
      );
      if ((data.suggestions ?? []).length === 0) {
        setError("No suggestions returned. Try a more specific prompt.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
      actions.addSuggestions([], msg);
    } finally {
      actions.setGenerating(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0d12]">
      <div className="px-4 py-2 border-b border-[#242a35] flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-[#9ca3af]">AI Assistant</div>
        {state.suggestions.length > 0 ? (
          <button
            onClick={actions.clearSuggestions}
            className="text-[10px] text-[#6b7280] hover:text-[#e5e7eb]"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {state.assistantMessages.length === 0 && state.suggestions.length === 0 ? (
          <Welcome />
        ) : null}

        {state.assistantMessages.map((m, i) => (
          <Message key={i} role={m.role} text={m.text} />
        ))}

        {state.isGenerating ? (
          <div className="text-[11px] text-[#9ca3af] italic px-1">Thinking…</div>
        ) : null}

        {state.suggestions.length > 0 ? (
          <div className="space-y-2 pt-1">
            <div className="text-[10px] uppercase tracking-wider text-[#9ca3af] px-1">
              {state.suggestions.length} pending {state.suggestions.length === 1 ? "change" : "changes"}
            </div>
            {state.suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onApprove={() => actions.applySuggestion(s.id)}
                onReject={() => actions.rejectSuggestion(s.id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#242a35] px-3 py-2.5 space-y-2">
        {error ? (
          <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-900/60 rounded px-2 py-1">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1">
          {PROMPT_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => send(chip)}
              disabled={state.isGenerating}
              className="text-[10px] px-2 h-6 rounded-full border border-[#242a35] bg-[#10141b] text-[#9ca3af] hover:text-[#e5e7eb] hover:border-emerald-700 transition-colors disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(prompt);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              state.suggestions.length > 0
                ? "Approve or reject the pending changes first…"
                : "Ask for an edit (e.g. tighten my summary)…"
            }
            disabled={state.isGenerating}
            className="flex-1 h-9 px-3 text-xs bg-[#0c1016] border border-[#242a35] rounded text-[#e5e7eb] placeholder:text-[#4b5563] focus:outline-none focus:border-emerald-600 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={state.isGenerating || !prompt.trim()}
            className="h-9 px-3 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isGenerating ? "…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Message({ role, text }: { role: "user" | "assistant"; text: string }) {
  return (
    <div
      className={
        role === "user"
          ? "rounded-md border border-[#242a35] bg-[#10141b] px-3 py-2 text-xs text-[#e5e7eb]"
          : "text-xs text-[#cbd5e1] leading-relaxed px-1"
      }
    >
      {role === "user" ? (
        <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">You</div>
      ) : null}
      <div className="whitespace-pre-wrap">{text}</div>
    </div>
  );
}

function Welcome() {
  return (
    <div className="text-xs text-[#9ca3af] leading-relaxed">
      <div className="text-[#e5e7eb] font-medium mb-1.5">Resume Studio AI</div>
      Ask the assistant to tighten bullets, tailor to a job description, or
      surface missing skills. Every change comes back as a reviewable diff —
      nothing is applied without your approval.
    </div>
  );
}
