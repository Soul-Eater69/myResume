import type { ResumeJson } from "@/schemas/resume";

export type ValidationReport = {
  errors: string[];
  warnings: string[];
  cleaned: ResumeJson;
};

export type GenerationContext = {
  experienceIds: Set<string>;
  projectIds: Set<string>;
  educationIds: Set<string>;
  knownSkills: Set<string>;
  knownCompanies: Set<string>;
  knownProjectTitles: Set<string>;
};

export function buildContext(opts: {
  experiences: { id: string; company: string }[];
  projects: { id: string; title: string }[];
  education: { id: string; institution: string }[];
  verifiedSkills: string[];
}): GenerationContext {
  return {
    experienceIds: new Set(opts.experiences.map((e) => e.id)),
    projectIds: new Set(opts.projects.map((p) => p.id)),
    educationIds: new Set(opts.education.map((e) => e.id)),
    knownSkills: new Set(opts.verifiedSkills.map((s) => s.toLowerCase())),
    knownCompanies: new Set(opts.experiences.map((e) => e.company.toLowerCase())),
    knownProjectTitles: new Set(opts.projects.map((p) => p.title.toLowerCase())),
  };
}

export function validateGeneratedResume(
  draft: ResumeJson,
  ctx: GenerationContext
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const experience = draft.experience.filter((e) => {
    if (e.experienceId && !ctx.experienceIds.has(e.experienceId)) {
      errors.push(`unknown experienceId: ${e.experienceId}`);
      return false;
    }
    if (!ctx.knownCompanies.has(e.company.toLowerCase())) {
      errors.push(`unknown company: ${e.company}`);
      return false;
    }
    return true;
  });

  const projects = draft.projects.filter((p) => {
    if (p.projectId && !ctx.projectIds.has(p.projectId)) {
      errors.push(`unknown projectId: ${p.projectId}`);
      return false;
    }
    if (!ctx.knownProjectTitles.has(p.title.toLowerCase())) {
      errors.push(`unknown project: ${p.title}`);
      return false;
    }
    return true;
  });

  const education = draft.education.filter((e) => {
    if (e.educationId && !ctx.educationIds.has(e.educationId)) {
      errors.push(`unknown educationId: ${e.educationId}`);
      return false;
    }
    return true;
  });

  const skills = draft.skills.filter((s) => {
    if (!ctx.knownSkills.has(s.toLowerCase())) {
      warnings.push(`skill not marked verified: ${s}`);
      return false;
    }
    return true;
  });

  const seenBullets = new Set<string>();
  for (const e of experience) {
    for (const b of e.bullets) {
      const key = b.trim().toLowerCase();
      if (seenBullets.has(key)) warnings.push(`duplicate bullet: "${b}"`);
      seenBullets.add(key);
    }
  }

  const totalBullets =
    experience.reduce((n, e) => n + e.bullets.length, 0) +
    projects.reduce((n, p) => n + p.bullets.length, 0);
  if (totalBullets > 30) warnings.push("resume may exceed safe page density");

  if ((draft.summary || "").length < 30) {
    warnings.push("summary is very short or missing");
  }

  const cleaned: ResumeJson = {
    ...draft,
    experience,
    projects,
    education,
    skills,
    warnings: [...draft.warnings, ...warnings],
  };

  return { errors, warnings, cleaned };
}
