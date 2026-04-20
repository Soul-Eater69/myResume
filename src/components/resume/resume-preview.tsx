"use client";

export function ResumePreviewFrame({ html }: { html: string }) {
  return (
    <div className="card p-0 overflow-hidden">
      <iframe
        className="w-full h-[900px] bg-white"
        srcDoc={html}
        title="Resume preview"
      />
    </div>
  );
}
