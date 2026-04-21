import { NextResponse } from "next/server";
import { HttpError } from "@/lib/errors";
import { consumeGithubOAuthState, issueSession } from "@/lib/auth";
import {
  completeGithubOAuthFromCode,
  getPublicAppOrigin,
} from "@/modules/auth/github-oauth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const appOrigin = getPublicAppOrigin(req);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const githubError = url.searchParams.get("error");
  const githubErrorDescription = url.searchParams.get("error_description");

  const fallback = new URL("/login", appOrigin);

  if (!state) {
    fallback.searchParams.set("authError", "Missing GitHub OAuth state.");
    return NextResponse.redirect(fallback);
  }

  const savedState = await consumeGithubOAuthState(state);
  if (!savedState) {
    fallback.searchParams.set(
      "authError",
      "GitHub sign-in expired or could not be verified. Please try again."
    );
    return NextResponse.redirect(fallback);
  }

  const errorParam = savedState.intent === "connect" ? "githubError" : "authError";
  const redirectWithError = (message: string) => {
    const target = new URL(savedState.errorReturnTo, appOrigin);
    target.searchParams.set(errorParam, message);
    return NextResponse.redirect(target);
  };

  if (githubError) {
    return redirectWithError(githubErrorDescription || githubError);
  }

  if (!code) {
    return redirectWithError("GitHub did not return an authorization code.");
  }

  try {
    const result = await completeGithubOAuthFromCode({
      req,
      code,
      intent: savedState.intent,
      currentUserId: savedState.userId,
    });

    await issueSession(result.userId);

    return NextResponse.redirect(new URL(savedState.returnTo, appOrigin));
  } catch (error) {
    const message =
      error instanceof HttpError
        ? error.message
        : "Could not complete GitHub authentication.";
    return redirectWithError(message);
  }
}
