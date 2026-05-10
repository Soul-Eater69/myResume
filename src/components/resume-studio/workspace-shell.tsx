"use client";
import { StudioProvider } from "./store";
import { StudioTopBar } from "./top-bar";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { ResumePreviewPanel } from "./resume-preview";
import { ResumeEditorPanel } from "./resume-editor-panel";
import { JobDescriptionPanel } from "./job-description-panel";
import { useStudio } from "./store";
import type { ResumeData } from "@/schemas/resume-studio";

export function StudioWorkspace({
  initial,
}: {
  initial: { resumeId: string; title: string; resume: ResumeData };
}) {
  return (
    <StudioProvider initial={initial}>
      <div className="h-screen flex flex-col bg-[#07090d] text-[#e5e7eb]">
        <StudioTopBar />
        <div className="flex-1 grid grid-cols-[28%_44%_28%] min-h-0 print:block">
          <aside className="border-r border-[#242a35] min-h-0 print:hidden">
            <AiAssistantPanel />
          </aside>
          <main className="min-h-0 print:!block">
            <ResumePreviewPanel />
          </main>
          <aside className="border-l border-[#242a35] min-h-0 flex flex-col print:hidden">
            <RightPanelTabs />
          </aside>
        </div>
      </div>
    </StudioProvider>
  );
}

function RightPanelTabs() {
  const { state, actions } = useStudio();
  return (
    <>
      <div className="shrink-0 border-b border-[#242a35] bg-[#0a0d12] px-2 py-1.5 flex gap-1">
        <TabButton
          active={state.rightTab === "resume"}
          onClick={() => actions.setTab("resume")}
        >
          Resume
        </TabButton>
        <TabButton
          active={state.rightTab === "job"}
          onClick={() => actions.setTab("job")}
        >
          Job description
        </TabButton>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {state.rightTab === "resume" ? <ResumeEditorPanel /> : <JobDescriptionPanel />}
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "h-7 px-2.5 text-[11px] font-medium rounded transition-colors " +
        (active
          ? "bg-[#1a2030] text-[#e5e7eb]"
          : "text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#10141b]")
      }
    >
      {children}
    </button>
  );
}
