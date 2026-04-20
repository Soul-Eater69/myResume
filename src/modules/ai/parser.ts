import { RESUME_PARSE_SYSTEM_PROMPT } from "./prompts";
import { extractJsonBlock, isLlmAvailableFor, llmJson } from "./provider";

export type ParsedResume = {
  basics: {
    name: string | null;
    headline: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    links: { label: string; url: string }[];
  };
  summary: string | null;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
    bullets: string[];
  }>;
  projects: Array<{
    title: string;
    description: string | null;
    repoUrl: string | null;
    liveUrl: string | null;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string | null;
    fieldOfStudy: string | null;
    startDate: string | null;
    endDate: string | null;
  }>;
  certifications: Array<{ name: string; issuer: string | null }>;
};

export async function parseResumeText(
  text: string,
  userId?: string | null
): Promise<ParsedResume> {
  if (await isLlmAvailableFor(userId)) {
    const result = await llmJson<ParsedResume>({
      system: RESUME_PARSE_SYSTEM_PROMPT,
      user: `Raw resume text:\n\n${text}`,
      parse: (raw) => JSON.parse(extractJsonBlock(raw)) as ParsedResume,
      maxTokens: 3500,
      userId,
    });
    if (result.ok) return result.data;
  }
  return ruleBasedParse(text);
}

function ruleBasedParse(text: string): ParsedResume {
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? null;
  const phone = text.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0] ?? null;
  const name = (text.trim().split(/\n/)[0] || "").slice(0, 80) || null;

  const links: { label: string; url: string }[] = [];
  for (const m of text.matchAll(/https?:\/\/[^\s)\]]+/g)) {
    const url = m[0];
    const label = /github\.com/.test(url)
      ? "GitHub"
      : /linkedin\.com/.test(url)
      ? "LinkedIn"
      : "Link";
    links.push({ label, url });
  }

  const sections = splitSections(text);

  const experience = parseExperienceSection(sections.experience || "");
  const projects = parseProjectsSection(sections.projects || "");
  const education = parseEducationSection(sections.education || "");
  const skills = (sections.skills || "")
    .split(/[,\n•·|]/)
    .map((s) => s.trim())
    .filter((s) => s && s.length <= 40)
    .slice(0, 40);

  return {
    basics: {
      name,
      headline: null,
      email,
      phone,
      location: null,
      links: dedupeLinks(links),
    },
    summary: sections.summary ? sections.summary.trim().slice(0, 600) : null,
    skills,
    experience,
    projects,
    education,
    certifications: [],
  };
}

const HEADERS = [
  { key: "summary", re: /^(summary|profile|objective)\b/i },
  { key: "experience", re: /^(experience|work experience|employment)\b/i },
  { key: "projects", re: /^(projects?)\b/i },
  { key: "education", re: /^(education)\b/i },
  { key: "skills", re: /^(skills|technical skills)\b/i },
] as const;

function splitSections(text: string): Record<string, string> {
  const lines = text.split(/\n/);
  const sections: Record<string, string> = {};
  let current: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (current) sections[current] = (sections[current] || "") + buf.join("\n");
    buf = [];
  };
  for (const line of lines) {
    const trimmed = line.trim();
    const hit = HEADERS.find((h) => h.re.test(trimmed));
    if (hit) {
      flush();
      current = hit.key;
      continue;
    }
    if (current) buf.push(line);
  }
  flush();
  return sections;
}

function parseExperienceSection(body: string) {
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out: ParsedResume["experience"] = [];
  for (const block of blocks) {
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const header = lines[0];
    const headerMatch = header.match(/^(.+?)\s*(?:[—\-–|@])\s*(.+?)$/);
    const title = headerMatch ? headerMatch[1] : header;
    const company = headerMatch ? headerMatch[2] : "Unknown";
    const bullets = lines
      .slice(1)
      .filter((l) => /^[-•*]/.test(l))
      .map((l) => l.replace(/^[-•*]\s*/, ""));
    out.push({
      company,
      title,
      location: null,
      startDate: null,
      endDate: null,
      isCurrent: false,
      bullets,
    });
  }
  return out;
}

function parseProjectsSection(body: string) {
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const title = lines[0] || "Untitled Project";
    const repoUrl = lines.find((l) => /github\.com/.test(l)) || null;
    const bullets = lines
      .slice(1)
      .filter((l) => /^[-•*]/.test(l))
      .map((l) => l.replace(/^[-•*]\s*/, ""));
    return {
      title,
      description: null,
      repoUrl,
      liveUrl: null,
      bullets,
    };
  });
}

function parseEducationSection(body: string) {
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const institution = lines[0] || "Unknown";
    const degree = lines[1] || null;
    return {
      institution,
      degree,
      fieldOfStudy: null,
      startDate: null,
      endDate: null,
    };
  });
}

function dedupeLinks(links: { label: string; url: string }[]) {
  const seen = new Set<string>();
  return links.filter((l) => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });
}
