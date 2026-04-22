import type { ResumeJson } from "@/schemas/resume";

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(d?: string | null): string {
  if (!d) return "Present";
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return d;
  return parsed.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export function renderResumeHtml(
  resume: ResumeJson,
  pageConstraint: "one_page" | "two_page" = "one_page"
): string {
  const twoPage = pageConstraint === "two_page";
  const b = resume.basics;
  const contact = [
    b.email ? esc(b.email) : null,
    b.phone ? esc(b.phone) : null,
    b.location ? esc(b.location) : null,
    ...b.links.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`),
  ]
    .filter(Boolean)
    .join(" &middot; ");

  const exp = resume.experience
    .map(
      (e) => `
    <div class="entry">
      <div class="entry-header">
        <div><strong>${esc(e.title)}</strong> &middot; ${esc(e.company)}</div>
        <div class="muted">${fmtDate(e.startDate)} — ${fmtDate(e.endDate)}</div>
      </div>
      ${e.location ? `<div class="muted small">${esc(e.location)}</div>` : ""}
      <ul>
        ${e.bullets.map((bl) => `<li>${esc(bl)}</li>`).join("")}
      </ul>
    </div>`
    )
    .join("");

  const projects = resume.projects
    .map(
      (p) => `
    <div class="entry">
      <div class="entry-header">
        <div><strong>${esc(p.title)}</strong>${p.link ? ` — <a href="${esc(p.link)}">${esc(p.link)}</a>` : ""}</div>
      </div>
      <ul>${p.bullets.map((bl) => `<li>${esc(bl)}</li>`).join("")}</ul>
    </div>`
    )
    .join("");

  const education = resume.education
    .map(
      (ed) => `
    <div class="entry">
      <div class="entry-header">
        <div><strong>${esc(ed.institution)}</strong>${ed.degree ? ` — ${esc(ed.degree)}${ed.fieldOfStudy ? ", " + esc(ed.fieldOfStudy) : ""}` : ""}</div>
        <div class="muted">${fmtDate(ed.startDate)} — ${fmtDate(ed.endDate)}</div>
      </div>
    </div>`
    )
    .join("");

  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<title>${esc(b.name)} — Resume</title>
<style>
  :root { color-scheme: light; }
  html,body { margin:0; padding:0; background:#fff; color:#111; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 10.5pt; line-height:1.45; }
  .page { max-width: 780px; margin: 0 auto; padding: 28px 36px; }
  h1 { margin:0; font-size: 22pt; }
  h2 { font-size: 11pt; text-transform: uppercase; letter-spacing:.06em; border-bottom:1px solid #d1d5db; padding-bottom:2px; margin:16px 0 6px; color:#1e3a8a; }
  .muted { color:#6b7280; }
  .small { font-size: 9.5pt; }
  .contact { color:#374151; font-size: 10pt; margin-top:4px; }
  .contact a { color:#1d4ed8; text-decoration:none; }
  .entry { margin: 8px 0; }
  .entry-header { display:flex; justify-content:space-between; gap:12px; }
  ul { margin: 4px 0 0; padding-left: 18px; }
  li { margin: 2px 0; }
  .skills { display:flex; flex-wrap:wrap; gap:6px; }
  .skill { background:#eff6ff; color:#1e3a8a; padding:2px 8px; border-radius:999px; font-size:9.5pt; }
  .page-break { border:none; border-top: 2px dashed #d1d5db; margin: 28px 0; padding-top: 4px; }
  .page-break::before { content: "— Page 2 —"; font-size:8pt; color:#9ca3af; display:block; text-align:center; margin-bottom:4px; }
  @media print { .page { padding: 18px 24px; } .page-break { break-before: page; border: none; } .page-break::before { display: none; } }
</style>
</head><body>
  <div class="page">
    <header>
      <h1>${esc(b.name)}</h1>
      ${b.headline ? `<div class="muted">${esc(b.headline)}</div>` : ""}
      <div class="contact">${contact}</div>
    </header>

    ${resume.summary ? `<section><h2>Summary</h2><p>${esc(resume.summary)}</p></section>` : ""}

    ${resume.skills.length ? `<section><h2>Skills</h2><div class="skills">${resume.skills
      .map((s) => `<span class="skill">${esc(s)}</span>`)
      .join("")}</div></section>` : ""}

    ${exp ? `<section><h2>Experience</h2>${exp}</section>` : ""}
    ${twoPage && (projects || education) ? `<div class="page-break"></div>` : ""}
    ${projects ? `<section><h2>Projects</h2>${projects}</section>` : ""}
    ${education ? `<section><h2>Education</h2>${education}</section>` : ""}
  </div>
</body></html>`;
}
