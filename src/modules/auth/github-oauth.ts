import { HttpError, badRequest, conflict } from "@/lib/errors";
import { db } from "@/lib/db";
import { connectGithub } from "@/modules/github/service";
import type { GithubOAuthIntent } from "@/lib/auth";

const GITHUB_OAUTH_SCOPE = "read:user user:email repo";
const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API = "https://api.github.com";

type GithubUser = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
};

type GithubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
};

export function isGithubOAuthConfigured() {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function getPublicAppOrigin(req: Request) {
  const candidates = [process.env.APP_URL?.trim(), new URL(req.url).origin];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return normalizePublicOrigin(candidate);
    } catch {
      continue;
    }
  }

  return "http://localhost:3000";
}

export function getGithubCallbackUrl(req: Request) {
  return new URL("/api/auth/github/callback", getPublicAppOrigin(req)).toString();
}

export function getGithubAuthorizeUrl(req: Request, state: string) {
  if (!process.env.GITHUB_CLIENT_ID) {
    throw badRequest(
      "GitHub OAuth is not configured. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET first.",
      "github_oauth_not_configured"
    );
  }

  const url = new URL(GITHUB_AUTHORIZE_URL);
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", getGithubCallbackUrl(req));
  url.searchParams.set("scope", GITHUB_OAUTH_SCOPE);
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "true");
  return url.toString();
}

export async function completeGithubOAuthFromCode({
  req,
  code,
  intent,
  currentUserId,
}: {
  req: Request;
  code: string;
  intent: GithubOAuthIntent;
  currentUserId?: string;
}) {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    throw badRequest(
      "GitHub OAuth is not configured. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET first.",
      "github_oauth_not_configured"
    );
  }

  const accessToken = await exchangeGithubCode(req, code);
  const githubUser = await fetchGithubUser(accessToken);
  const email = await fetchVerifiedGithubEmail(accessToken, githubUser.email);
  const githubUserId = String(githubUser.id);

  if (intent === "connect") {
    if (!currentUserId) {
      throw badRequest("Sign in before connecting GitHub.", "github_connect_requires_auth");
    }

    const existingGithubUser = await db.user.findUnique({
      where: { githubUserId },
      select: { id: true },
    });
    if (existingGithubUser && existingGithubUser.id !== currentUserId) {
      throw conflict("This GitHub account is already linked to another user.");
    }

    const currentUser = await db.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, githubUserId: true },
    });
    if (!currentUser) {
      throw badRequest("User not found.", "github_connect_requires_auth");
    }
    if (currentUser.githubUserId && currentUser.githubUserId !== githubUserId) {
      throw conflict("Your account is already linked to a different GitHub account.");
    }

    const user = await db.user.update({
      where: { id: currentUserId },
      data: { githubUserId },
      select: { id: true, email: true, name: true },
    });

    await connectGithub(user.id, accessToken);

    return { userId: user.id, email: user.email, name: user.name };
  }

  const existingGithubUser = await db.user.findUnique({
    where: { githubUserId },
    select: { id: true, email: true, name: true, githubUserId: true },
  });
  if (existingGithubUser) {
    await connectGithub(existingGithubUser.id, accessToken);
    return {
      userId: existingGithubUser.id,
      email: existingGithubUser.email,
      name: existingGithubUser.name,
    };
  }

  const existingEmailUser = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, githubUserId: true },
  });
  if (existingEmailUser) {
    if (existingEmailUser.githubUserId && existingEmailUser.githubUserId !== githubUserId) {
      throw conflict("That email is already linked to a different GitHub account.");
    }

    const linkedUser = await db.user.update({
      where: { id: existingEmailUser.id },
      data: { githubUserId },
      select: { id: true, email: true, name: true },
    });

    await connectGithub(linkedUser.id, accessToken);

    return { userId: linkedUser.id, email: linkedUser.email, name: linkedUser.name };
  }

  const createdUser = await db.user.create({
    data: {
      email,
      name: githubUser.name?.trim() || githubUser.login,
      passwordHash: null,
      githubUserId,
      profile: { create: {} },
    },
    select: { id: true, email: true, name: true },
  });

  await connectGithub(createdUser.id, accessToken);

  return { userId: createdUser.id, email: createdUser.email, name: createdUser.name };
}

async function exchangeGithubCode(req: Request, code: string) {
  const res = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "open-resume-platform",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: getGithubCallbackUrl(req),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    const message =
      data.error_description ||
      data.error ||
      "GitHub did not return an access token.";
    throw new HttpError(502, "github_oauth_exchange_failed", message);
  }

  return data.access_token;
}

async function fetchGithubUser(accessToken: string) {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: githubHeaders(accessToken),
  });
  if (!res.ok) {
    throw new HttpError(502, "github_user_lookup_failed", "Could not load your GitHub profile.");
  }
  return (await res.json()) as GithubUser;
}

async function fetchVerifiedGithubEmail(
  accessToken: string,
  fallbackEmail: string | null
) {
  const res = await fetch(`${GITHUB_API}/user/emails`, {
    headers: githubHeaders(accessToken),
  });
  if (!res.ok) {
    if (fallbackEmail) return fallbackEmail.toLowerCase();
    throw new HttpError(
      502,
      "github_email_lookup_failed",
      "Could not load a verified GitHub email address."
    );
  }

  const emails = ((await res.json()) as GithubEmail[])
    .filter((entry) => entry.verified)
    .sort((left, right) => Number(right.primary) - Number(left.primary));

  if (emails.length > 0) return emails[0].email.toLowerCase();
  if (fallbackEmail) return fallbackEmail.toLowerCase();

  throw badRequest(
    "GitHub did not return a verified email address for this account.",
    "github_verified_email_required"
  );
}

function githubHeaders(accessToken: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "open-resume-platform",
  };
}

function normalizePublicOrigin(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.hostname === "0.0.0.0" || url.hostname === "::" || url.hostname === "[::]") {
    url.hostname = "localhost";
  }
  return url.origin;
}
