"use client";
import { useMemo } from "react";
import { useStudio } from "./store";
import { StudioTextarea } from "./section-card";

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","in","on","for","with","to","by","from","at","is","are","was","were","be","been","being","this","that","these","those","it","its","as","we","you","they","our","their","your","i","he","she","them","us","our",
  "ability","experience","experienced","strong","good","great","excellent","preferred","required","must","should","will","would","can","may","work","working","team","teams","you'll","you’ll","using","use","new","best",
  "skills","skill","job","role","candidate","position","company","ideal","including","plus",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function topKeywords(jd: string, n: number): { word: string; count: number }[] {
  const tokens = tokenize(jd);
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export function JobDescriptionPanel() {
  const { state, actions } = useStudio();

  const analysis = useMemo(() => {
    if (!state.jobDescription.trim()) return null;
    const keywords = topKeywords(state.jobDescription, 30);

    const haystack = [
      state.resume.summary,
      ...state.resume.experience.flatMap((e) => [e.title, e.company, ...e.bullets]),
      ...state.resume.projects.flatMap((p) => [p.name, p.description, ...p.bullets, ...p.techStack]),
      ...state.resume.skills.flatMap((s) => [s.category, ...s.items]),
    ]
      .join(" ")
      .toLowerCase();

    const matched = keywords.filter((k) => haystack.includes(k.word));
    const missing = keywords.filter((k) => !haystack.includes(k.word));
    const matchScore = keywords.length
      ? Math.round((matched.length / keywords.length) * 100)
      : 0;

    return { keywords, matched, missing, matchScore };
  }, [state.jobDescription, state.resume]);

  async function tailor() {
    if (!state.jobDescription.trim() || state.isGenerating) return;
    actions.pushUserMessage("Tailor my resume to this job description.");
    actions.setTab("resume");
    actions.setGenerating(true);
    try {
      const res = await fetch("/api/resume-studio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: state.resumeId,
          resume: state.resume,
          jobDescription: state.jobDescription,
          userPrompt:
            "Tailor the resume to this job description. Prioritize matching the most important keywords. Strengthen weak bullets and surface missing skills.",
        }),
      });
      const data = await res.json().catch(() => ({}));
      actions.addSuggestions(
        data.suggestions ?? [],
        data.assistantMessage ||
          (res.ok
            ? "No suggestions returned."
            : data.message || "Tailoring failed.")
      );
    } catch (err) {
      actions.addSuggestions(
        [],
        err instanceof Error ? err.message : "Network error."
      );
    } finally {
      actions.setGenerating(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-3 border-b border-[#242a35]">
        <div className="text-[10px] font-medium uppercase tracking-wider text-[#9ca3af] mb-1.5">
          Job description
        </div>
        <StudioTextarea
          value={state.jobDescription}
          onChange={actions.setJobDescription}
          placeholder="Paste the JD here. We'll surface keywords, missing skills, and let you tailor with one click."
          rows={10}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {analysis ? (
          <>
            <div className="rounded-md border border-[#242a35] bg-[#10141b] p-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider text-[#9ca3af]">
                  Match score
                </div>
                <div className="text-base font-semibold text-emerald-400">
                  {analysis.matchScore}%
                </div>
              </div>
              <div className="mt-2 h-1 rounded bg-[#0c1016] overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${analysis.matchScore}%` }}
                />
              </div>
              <div className="text-[10px] text-[#6b7280] mt-2">
                Based on {analysis.keywords.length} top keywords from the JD.
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1.5">
                Missing in your resume
              </div>
              {analysis.missing.length === 0 ? (
                <div className="text-[11px] text-[#6b7280] italic">
                  Nothing obvious — your resume covers the top keywords.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {analysis.missing.slice(0, 20).map((k) => (
                    <span
                      key={k.word}
                      className="text-[10px] px-1.5 h-5 inline-flex items-center rounded border border-[#3a1d1d] bg-[#2a1212]/50 text-[#fca5a5]"
                    >
                      {k.word}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1.5">
                Already covered
              </div>
              {analysis.matched.length === 0 ? (
                <div className="text-[11px] text-[#6b7280] italic">None yet.</div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {analysis.matched.slice(0, 24).map((k) => (
                    <span
                      key={k.word}
                      className="text-[10px] px-1.5 h-5 inline-flex items-center rounded border border-[#1d3a2a] bg-[#0e2a1c]/60 text-[#86efac]"
                    >
                      {k.word}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={tailor}
              disabled={state.isGenerating}
              className="w-full h-9 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
            >
              {state.isGenerating ? "Tailoring…" : "Tailor resume to this JD"}
            </button>
          </>
        ) : (
          <div className="text-[11px] text-[#6b7280] italic">
            Paste a JD above to see keyword coverage and tailor with AI.
          </div>
        )}
      </div>
    </div>
  );
}
