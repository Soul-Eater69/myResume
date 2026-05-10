"use client";
import { useStudio } from "./store";
import type { ResumeData } from "@/schemas/resume-studio";

export function ResumePreviewPanel() {
  const { state } = useStudio();
  return (
    <div className="h-full flex flex-col bg-[#0a0d12] overflow-hidden">
      <div className="px-4 py-2 border-b border-[#242a35] flex items-center justify-between text-[11px] text-[#9ca3af]">
        <div className="inline-flex items-center gap-1">
          <span className="px-1.5 h-5 inline-flex items-center rounded bg-[#1a2030] text-[#e5e7eb] font-medium">
            Resume
          </span>
          <span className="text-[#4b5563]">·</span>
          <span>Live preview</span>
        </div>
        <div className="text-[10px] text-[#6b7280]">
          Letter · 8.5 × 11 in
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <ResumePage data={state.resume} />
      </div>
    </div>
  );
}

function ResumePage({ data }: { data: ResumeData }) {
  return (
    <div
      id="resume-page"
      className="resume-page bg-white text-[#111] shadow-lg"
      style={{
        width: "8.5in",
        minHeight: "11in",
        padding: "0.55in 0.7in",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "10.5pt",
        lineHeight: 1.35,
        color: "#111",
      }}
    >
      <Header data={data} />
      {data.summary?.trim() ? <Summary text={data.summary} /> : null}
      {data.experience.length ? <Experience data={data} /> : null}
      {data.projects.length ? <Projects data={data} /> : null}
      {data.education.length ? <Education data={data} /> : null}
      {data.skills.length ? <Skills data={data} /> : null}
    </div>
  );
}

function Header({ data }: { data: ResumeData }) {
  const { contact } = data;
  const lineParts = [
    contact.location,
    contact.phone,
    contact.email,
    contact.linkedin,
    contact.github,
    contact.portfolio,
  ].filter((v) => v && v.trim());
  return (
    <div style={{ textAlign: "center", marginBottom: "10pt" }}>
      <div style={{ fontSize: "20pt", fontWeight: 700, letterSpacing: "0.01em" }}>
        {contact.fullName || "Your Name"}
      </div>
      {lineParts.length ? (
        <div style={{ fontSize: "9.5pt", marginTop: "4pt", color: "#374151" }}>
          {lineParts.join(" | ")}
        </div>
      ) : null}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "11pt",
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        borderBottom: "1px solid #111",
        marginTop: "10pt",
        marginBottom: "5pt",
        paddingBottom: "1pt",
      }}
    >
      {children}
    </div>
  );
}

function Summary({ text }: { text: string }) {
  return (
    <div>
      <SectionTitle>Summary</SectionTitle>
      <p style={{ margin: 0 }}>{text}</p>
    </div>
  );
}

function Experience({ data }: { data: ResumeData }) {
  return (
    <div>
      <SectionTitle>Experience</SectionTitle>
      {data.experience.map((e) => (
        <div key={e.id} style={{ marginBottom: "8pt" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "8pt" }}>
            <div style={{ fontWeight: 700 }}>
              {e.title || "Role"}
              {e.company ? <span style={{ fontWeight: 400 }}> — {e.company}</span> : null}
            </div>
            <div style={{ fontSize: "9.5pt", color: "#374151", whiteSpace: "nowrap" }}>
              {formatDateRange(e.startDate, e.endDate, e.current)}
            </div>
          </div>
          {e.location ? (
            <div style={{ fontSize: "9.5pt", color: "#374151", fontStyle: "italic" }}>
              {e.location}
            </div>
          ) : null}
          {e.bullets.length ? (
            <ul style={{ margin: "3pt 0 0 14pt", padding: 0 }}>
              {e.bullets
                .filter((b) => b.trim())
                .map((b, i) => (
                  <li key={i} style={{ marginBottom: "2pt" }}>
                    {b}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Projects({ data }: { data: ResumeData }) {
  return (
    <div>
      <SectionTitle>Projects</SectionTitle>
      {data.projects.map((p) => (
        <div key={p.id} style={{ marginBottom: "8pt" }}>
          <div style={{ fontWeight: 700 }}>
            {p.name || "Project"}
            {p.techStack.length ? (
              <span style={{ fontWeight: 400, fontSize: "9.5pt", color: "#374151" }}>
                {" "}
                — {p.techStack.join(", ")}
              </span>
            ) : null}
          </div>
          {p.description ? (
            <div style={{ fontSize: "10pt", color: "#374151" }}>{p.description}</div>
          ) : null}
          {p.bullets.length ? (
            <ul style={{ margin: "3pt 0 0 14pt", padding: 0 }}>
              {p.bullets
                .filter((b) => b.trim())
                .map((b, i) => (
                  <li key={i} style={{ marginBottom: "2pt" }}>
                    {b}
                  </li>
                ))}
            </ul>
          ) : null}
          {p.links.filter((l) => l.trim()).length ? (
            <div style={{ fontSize: "9pt", color: "#374151", marginTop: "2pt" }}>
              {p.links.filter((l) => l.trim()).join(" · ")}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Education({ data }: { data: ResumeData }) {
  return (
    <div>
      <SectionTitle>Education</SectionTitle>
      {data.education.map((e) => (
        <div key={e.id} style={{ marginBottom: "5pt" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700 }}>{e.school || "Institution"}</div>
            <div style={{ fontSize: "9.5pt", color: "#374151" }}>
              {formatDateRange(e.startDate, e.endDate, false)}
            </div>
          </div>
          <div style={{ fontSize: "10pt", color: "#374151", fontStyle: "italic" }}>
            {e.degree}
            {e.location ? ` · ${e.location}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function Skills({ data }: { data: ResumeData }) {
  return (
    <div>
      <SectionTitle>Skills</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "max-content 1fr", columnGap: "10pt", rowGap: "3pt" }}>
        {data.skills.map((cat, i) => (
          <Row key={i} category={cat.category} items={cat.items.join(", ")} />
        ))}
      </div>
    </div>
  );
}

function Row({ category, items }: { category: string; items: string }) {
  return (
    <>
      <div style={{ fontWeight: 700 }}>{category || "—"}</div>
      <div>{items}</div>
    </>
  );
}

function formatDateRange(start: string, end: string, current: boolean): string {
  if (!start && !end && !current) return "";
  const s = start || "";
  const e = current ? "Present" : end || "";
  if (s && e) return `${s} – ${e}`;
  return s || e;
}
