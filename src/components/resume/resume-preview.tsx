"use client";

export function ResumePreviewFrame({
  html,
  pageConstraint = "one_page",
}: {
  html: string;
  pageConstraint?: "one_page" | "two_page";
}) {
  const height = pageConstraint === "two_page" ? "h-[1700px]" : "h-[900px]";
  return (
    <div className="card p-0 overflow-hidden">
      <iframe
        className={`w-full ${height} bg-white`}
        srcDoc={html}
        title="Resume preview"
      />
    </div>
  );
}
