import { db } from "@/lib/db";
import { badRequest, notFound, HttpError } from "@/lib/errors";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { summarizeRepo } from "@/modules/ai/summarizer";
import { logger } from "@/lib/logger";

const GITHUB_API = "https://api.github.com";

async function gh<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "open-resume-platform",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.warn("github_api_error", { path, status: res.status, body: body.slice(0, 500) });
    if (res.status === 401 || res.status === 403) {
      throw new HttpError(401, "github_unauthorized", "GitHub rejected the token. Re-connect with a valid token.");
    }
    if (res.status === 403 && /rate limit/i.test(body)) {
      throw new HttpError(429, "github_rate_limited", "GitHub API rate limit reached. Try again in a few minutes.");
    }
    if (res.status === 404) {
      throw new HttpError(404, "github_not_found", `GitHub resource not found: ${path}`);
    }
    throw new HttpError(502, "github_upstream", `GitHub request failed (${res.status}).`);
  }
  return (await res.json()) as T;
}

export async function connectGithub(userId: string, token: string) {
  if (!token || token.length < 20) throw badRequest("invalid token");
  const encrypted = encryptSecret(token);
  const existing = await db.githubConnection.findUnique({ where: { userId } });
  if (existing) {
    await db.githubRepo.deleteMany({ where: { userId } });
  }
  return db.githubConnection.upsert({
    where: { userId },
    create: { userId, accessTokenEncrypted: encrypted },
    update: { accessTokenEncrypted: encrypted, connectionStatus: "active" },
    select: { id: true, connectionStatus: true, createdAt: true, updatedAt: true },
  });
}

export async function disconnectGithub(userId: string) {
  await db.githubRepo.deleteMany({ where: { userId } });
  await db.githubConnection.deleteMany({ where: { userId } });
}

async function getToken(userId: string): Promise<string> {
  const conn = await db.githubConnection.findUnique({ where: { userId } });
  if (!conn || !conn.accessTokenEncrypted)
    throw new HttpError(400, "github_not_connected", "Connect GitHub before performing this action.");
  return decryptSecret(conn.accessTokenEncrypted);
}

type GhRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  default_branch: string;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  private: boolean;
  languages_url: string;
};

export async function syncRepos(userId: string) {
  const token = await getToken(userId);
  const repos = await gh<GhRepo[]>(
    "/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator",
    token
  );

  const incomingIds = new Set(repos.map((r) => String(r.id)));
  await db.githubRepo.deleteMany({
    where: { userId, externalRepoId: { notIn: Array.from(incomingIds) } },
  });

  const results = [] as { id: string; name: string }[];
  let languageFailures = 0;
  for (const r of repos) {
    const languages = await gh<Record<string, number>>(
      `/repos/${r.full_name}/languages`,
      token
    ).catch(() => {
      languageFailures += 1;
      return {} as Record<string, number>;
    });
    const topics = r.topics ?? [];

    const saved = await db.githubRepo.upsert({
      where: { userId_externalRepoId: { userId, externalRepoId: String(r.id) } },
      create: {
        userId,
        externalRepoId: String(r.id),
        name: r.name,
        fullName: r.full_name,
        htmlUrl: r.html_url,
        description: r.description,
        defaultBranch: r.default_branch,
        languages: Object.keys(languages),
        topics,
        stars: r.stargazers_count,
        forks: r.forks_count,
        lastPushedAt: r.pushed_at ? new Date(r.pushed_at) : null,
        isPrivate: r.private,
        syncStatus: "synced",
      },
      update: {
        name: r.name,
        fullName: r.full_name,
        htmlUrl: r.html_url,
        description: r.description,
        defaultBranch: r.default_branch,
        languages: Object.keys(languages),
        topics,
        stars: r.stargazers_count,
        forks: r.forks_count,
        lastPushedAt: r.pushed_at ? new Date(r.pushed_at) : null,
        isPrivate: r.private,
        syncStatus: "synced",
      },
    });
    results.push({ id: saved.id, name: saved.name });
  }
  return { count: results.length, repos: results, languageFailures };
}

export async function listRepos(userId: string) {
  return db.githubRepo.findMany({
    where: { userId },
    orderBy: { lastPushedAt: "desc" },
    include: { summary: true },
  });
}

export type RepoWithSummary = Awaited<ReturnType<typeof listRepos>>[number];

export async function listImportedRepoUrls(userId: string): Promise<Set<string>> {
  const rows = await db.project.findMany({
    where: { userId, sourceType: "github" },
    select: { repoUrl: true },
  });
  return new Set(rows.map((r) => r.repoUrl).filter((u): u is string => Boolean(u)));
}

export async function summarizeRepoById(userId: string, repoId: string) {
  const repo = await db.githubRepo.findFirst({
    where: { id: repoId, userId },
  });
  if (!repo) throw notFound("repo not found");

  let readme: string | null = null;
  try {
    const token = await getToken(userId);
    const res = await fetch(
      `${GITHUB_API}/repos/${repo.fullName}/readme`,
      {
        headers: {
          Accept: "application/vnd.github.raw",
          Authorization: `Bearer ${token}`,
          "User-Agent": "open-resume-platform",
        },
      }
    );
    if (res.ok) readme = await res.text();
  } catch {
    readme = null;
  }

  const { draft, source } = await summarizeRepo(
    {
      name: repo.name,
      description: repo.description,
      languages: toStringArray(repo.languages),
      topics: toStringArray(repo.topics),
      readmeText: readme,
      stars: repo.stars ?? 0,
    },
    userId
  );

  const saved = await db.repoSummary.upsert({
    where: { repoId },
    create: { repoId, readmeText: readme, ...draft },
    update: { readmeText: readme, ...draft },
  });

  return { summary: saved, source, fallback: source === "rule_based" };
}

export async function importRepoToProject(userId: string, repoId: string) {
  const repo = await db.githubRepo.findFirst({
    where: { id: repoId, userId },
    include: { summary: true },
  });
  if (!repo) throw notFound("repo not found");
  if (!repo.summary) throw badRequest("repo not summarized yet");

  const title = repo.summary.resumeReadyTitle ?? repo.name;
  const description = repo.summary.summary ?? repo.description ?? null;
  const techStack = repo.summary.techTags ?? [];
  const domainTags = repo.summary.roleTags ?? [];
  const newBullets = toStringArray(repo.summary.resumeReadyBullets);

  const existing = await db.project.findFirst({
    where: { userId, repoUrl: repo.htmlUrl },
  });

  if (existing) {
    await db.projectBullet.deleteMany({ where: { projectId: existing.id } });
    await db.projectBullet.createMany({
      data: newBullets.map((b, i) => ({
        projectId: existing.id,
        bulletText: b,
        sortOrder: i,
        isVerified: false,
      })),
    });
    return db.project.update({
      where: { id: existing.id },
      data: { title, description, techStack, domainTags, sourceType: "github" },
    });
  }

  return db.project.create({
    data: {
      userId,
      title,
      description,
      repoUrl: repo.htmlUrl,
      techStack,
      domainTags,
      sourceType: "github",
      isVerified: false,
      bullets: {
        create: newBullets.map((b, i) => ({
          bulletText: b,
          sortOrder: i,
          isVerified: false,
        })),
      },
    },
  });
}

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}
