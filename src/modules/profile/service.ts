import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import type {
  ProfileUpdateInput,
  ExperienceInput,
  ProjectInput,
  SkillInput,
  EducationInput,
  CertificationInput,
  ProfileLinkInput,
} from "@/schemas/profile";

const selectExperience = {
  id: true,
  company: true,
  title: true,
  location: true,
  employmentType: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  description: true,
  techStack: true,
  domainTags: true,
  sourceType: true,
  bullets: { orderBy: { sortOrder: "asc" } },
  createdAt: true,
  updatedAt: true,
} as const;

const selectProject = {
  id: true,
  title: true,
  description: true,
  repoUrl: true,
  liveUrl: true,
  techStack: true,
  domainTags: true,
  sourceType: true,
  isVerified: true,
  bullets: { orderBy: { sortOrder: "asc" } },
  createdAt: true,
  updatedAt: true,
} as const;

export async function getFullProfile(userId: string) {
  const [profile, user, experiences, projects, skills, educations, certs, links] =
    await Promise.all([
      db.profile.findUnique({ where: { userId } }),
      db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      }),
      db.experience.findMany({
        where: { userId },
        orderBy: [{ isCurrent: "desc" }, { endDate: "desc" }, { startDate: "desc" }],
        select: selectExperience,
      }),
      db.project.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: selectProject,
      }),
      db.skill.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      db.education.findMany({ where: { userId }, orderBy: { endDate: "desc" } }),
      db.certification.findMany({ where: { userId }, orderBy: { issueDate: "desc" } }),
      db.profileLink.findMany({ where: { userId }, orderBy: { label: "asc" } }),
    ]);
  return { user, profile, experiences, projects, skills, educations, certifications: certs, links };
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  return db.profile.upsert({
    where: { userId },
    create: { userId, ...normalize(input) },
    update: normalize(input),
  });
}

function normalize(input: ProfileUpdateInput) {
  return {
    headline: input.headline ?? null,
    summary: input.summary ?? null,
    targetRoles: input.targetRoles ?? undefined,
    preferredLocations: input.preferredLocations ?? undefined,
    yearsOfExperience: input.yearsOfExperience ?? undefined,
  };
}

export async function createExperience(userId: string, input: ExperienceInput) {
  return db.experience.create({
    data: {
      userId,
      company: input.company,
      title: input.title,
      location: input.location ?? null,
      employmentType: input.employmentType ?? null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      isCurrent: input.isCurrent ?? false,
      description: input.description ?? null,
      techStack: input.techStack ?? [],
      domainTags: input.domainTags ?? [],
      bullets: {
        create: input.bullets.map((b, i) => ({ bulletText: b, sortOrder: i })),
      },
    },
    select: selectExperience,
  });
}

export async function updateExperience(
  userId: string,
  id: string,
  input: Partial<ExperienceInput>
) {
  const existing = await db.experience.findFirst({ where: { id, userId } });
  if (!existing) throw notFound("experience not found");

  if (input.bullets) {
    await db.experienceBullet.deleteMany({ where: { experienceId: id } });
    await db.experienceBullet.createMany({
      data: input.bullets.map((b, i) => ({
        experienceId: id,
        bulletText: b,
        sortOrder: i,
      })),
    });
  }

  return db.experience.update({
    where: { id },
    data: {
      company: input.company ?? undefined,
      title: input.title ?? undefined,
      location: input.location ?? undefined,
      employmentType: input.employmentType ?? undefined,
      startDate:
        input.startDate === undefined
          ? undefined
          : input.startDate
          ? new Date(input.startDate)
          : null,
      endDate:
        input.endDate === undefined
          ? undefined
          : input.endDate
          ? new Date(input.endDate)
          : null,
      isCurrent: input.isCurrent ?? undefined,
      description: input.description ?? undefined,
      techStack: input.techStack ?? undefined,
      domainTags: input.domainTags ?? undefined,
    },
    select: selectExperience,
  });
}

export async function deleteExperience(userId: string, id: string) {
  const res = await db.experience.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw notFound("experience not found");
}

export async function createProject(userId: string, input: ProjectInput) {
  return db.project.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      repoUrl: input.repoUrl ?? null,
      liveUrl: input.liveUrl ?? null,
      techStack: input.techStack ?? [],
      domainTags: input.domainTags ?? [],
      isVerified: input.isVerified ?? true,
      bullets: {
        create: input.bullets.map((b, i) => ({ bulletText: b, sortOrder: i })),
      },
    },
    select: selectProject,
  });
}

export async function updateProject(
  userId: string,
  id: string,
  input: Partial<ProjectInput>
) {
  const existing = await db.project.findFirst({ where: { id, userId } });
  if (!existing) throw notFound("project not found");

  if (input.bullets) {
    await db.projectBullet.deleteMany({ where: { projectId: id } });
    await db.projectBullet.createMany({
      data: input.bullets.map((b, i) => ({
        projectId: id,
        bulletText: b,
        sortOrder: i,
      })),
    });
  }

  return db.project.update({
    where: { id },
    data: {
      title: input.title ?? undefined,
      description: input.description ?? undefined,
      repoUrl: input.repoUrl ?? undefined,
      liveUrl: input.liveUrl ?? undefined,
      techStack: input.techStack ?? undefined,
      domainTags: input.domainTags ?? undefined,
      isVerified: input.isVerified ?? undefined,
    },
    select: selectProject,
  });
}

export async function deleteProject(userId: string, id: string) {
  const res = await db.project.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw notFound("project not found");
}

export async function createSkill(userId: string, input: SkillInput) {
  return db.skill.upsert({
    where: { userId_name: { userId, name: input.name } },
    create: {
      userId,
      name: input.name,
      category: input.category ?? null,
      proficiency: input.proficiency ?? null,
    },
    update: {
      category: input.category ?? null,
      proficiency: input.proficiency ?? null,
    },
  });
}

export async function deleteSkill(userId: string, id: string) {
  const res = await db.skill.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw notFound("skill not found");
}

export async function createEducation(userId: string, input: EducationInput) {
  return db.education.create({
    data: {
      userId,
      institution: input.institution,
      degree: input.degree ?? null,
      fieldOfStudy: input.fieldOfStudy ?? null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      gpa: input.gpa ?? null,
    },
  });
}

export async function deleteEducation(userId: string, id: string) {
  const res = await db.education.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw notFound("education not found");
}

export async function createCertification(
  userId: string,
  input: CertificationInput
) {
  return db.certification.create({
    data: {
      userId,
      name: input.name,
      issuer: input.issuer ?? null,
      issueDate: input.issueDate ? new Date(input.issueDate) : null,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      credentialUrl: input.credentialUrl ?? null,
    },
  });
}

export async function deleteCertification(userId: string, id: string) {
  const res = await db.certification.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw notFound("certification not found");
}

export async function createLink(userId: string, input: ProfileLinkInput) {
  return db.profileLink.create({
    data: { userId, label: input.label, url: input.url },
  });
}

export async function deleteLink(userId: string, id: string) {
  const res = await db.profileLink.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw notFound("link not found");
}
