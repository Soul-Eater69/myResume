import { db } from "@/lib/db";
import { badRequest, notFound } from "@/lib/errors";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { summarizeRepo } from "@/modules/ai/summarizer";

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
    throw new Error(`github ${path} failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  return (await res.json()) as T;
}

export async function connectGithub(userId: string, token: string) {
  if (!token || token.length < 20) throw badRequest("invalid token");
  const encrypted = encryptSecret(token);
  return db.githubConnection.upsert({
    where: { userId },
    create: { userId, accessTokenEncrypted: encrypted },
    update: { accessTokenEncrypted: encrypted, connectionStatus: "active" },
    select: { id: true, connectionStatus: true, createdAt: true, updatedAt: true },
  });
}

export async function disconnectGithub(userId: string) {
  await db.githubConnection.updateMany({
    where: { userId },
    data: { connectionStatus: "disconnected", accessTokenEncrypted: null },
  });
}

async function getToken(userId: string): Promise<string> {
  const conn = await db.githubConnection.findUnique({ where: { userId } });
  if (!conn || !conn.accessTokenEncrypted) throw badRequest("github not connected");
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

  const results = [] as { id: string; name: string }[];
  for (const r of repos) {
    const languages = await gh<Record<string, number>>(
      `/repos/${r.full_name}/languages`,
      token
    ).catch(() => ({}));
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
  return { count: results.length, repos: results };
}

export async function listRepos(userId: string) {
  return db.githubRepo.findMany({
    where: { userId },
    orderBy: { lastPushedAt: "desc" },
    include: { summary: true },
  });
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

  const draft = await summarizeRepo({
    name: repo.name,
    description: repo.description,
    languages: toStringArray(repo.languages),
    topics: toStringArray(repo.topics),
    readmeText: readme,
    stars: repo.stars ?? 0,
  });

  return db.repoSummary.upsert({
    where: { repoId },
    create: { repoId, readmeText: readme, ...draft },
    update: { readmeText: readme, ...draft },
  });
}

export async function importRepoToProject(userId: string, repoId: string) {
  const repo = await db.githubRepo.findFirst({
    where: { id: repoId, userId },
    include: { summary: true },
  });
  if (!repo) throw notFound("repo not found");
  if (!repo.summary) throw badRequest("repo not summarized yet");

  return db.project.create({
    data: {
      userId,
      title: repo.summary.resumeReadyTitle ?? repo.name,
      description: repo.summary.summary ?? repo.description ?? null,
      repoUrl: repo.htmlUrl,
      techStack: repo.summary.techTags ?? [],
      domainTags: repo.summary.roleTags ?? [],
      sourceType: "github",
      isVerified: false,
      bullets: {
        create: toStringArray(repo.summary.resumeReadyBullets).map((b, i) => ({
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
