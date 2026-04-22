import { NextResponse } from "next/server";
import {
  getSessionUserId,
  issueGithubOAuthState,
  sanitizeAppPath,
} from "@/lib/auth";
import {
  getPublicAppOrigin,
  getGithubAuthorizeUrl,
  isGithubOAuthConfigured,
} from "@/modules/auth/github-oauth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const appOrigin = getPublicAppOrigin(req);
  const intent = url.searchParams.get("intent") === "connect" ? "connect" : "login";
  const returnTo = sanitizeAppPath(
    url.searchParams.get("returnTo"),
    intent === "connect" ? "/github" : "/dashboard"
  );
  const errorReturnTo = sanitizeAppPath(
    url.searchParams.get("errorReturnTo"),
    intent === "connect" ? "/github" : "/login"
  );

  const redirectWithError = (message: string) => {
    const target = new URL(errorReturnTo, appOrigin);
    target.searchParams.set(intent === "connect" ? "githubError" : "authError", message);
    return NextResponse.redirect(target);
  };

  if (!isGithubOAuthConfigured()) {
    return redirectWithError(
      "GitHub OAuth is not configured yet. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET first."
    );
  }

  const currentUserId = await getSessionUserId();
  if (intent === "connect" && !currentUserId) {
    return redirectWithError("Sign in before connecting GitHub.");
  }

  const state = await issueGithubOAuthState({
    intent,
    returnTo,
    errorReturnTo,
    userId: currentUserId ?? undefined,
  });

  return NextResponse.redirect(getGithubAuthorizeUrl(req, state));
}
