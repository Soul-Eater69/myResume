"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";

const GITHUB_LOGIN_URL =
  "/api/auth/github/start?intent=login&returnTo=/dashboard&errorReturnTo=/login";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageContent authError={null} />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  return <LoginPageContent authError={searchParams.get("authError")} />;
}

function LoginPageContent({ authError }: { authError: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Invalid email or password.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function startGithubLogin() {
    setGithubLoading(true);
    window.location.assign(GITHUB_LOGIN_URL);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-md bg-brand-600 text-white flex items-center justify-center shadow-xs">
            <Icon.Bolt className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold text-fg">Open Resume</span>
        </Link>

        <form onSubmit={onSubmit} className="surface p-6 space-y-4">
          <div>
            <h1 className="text-lg font-semibold text-fg">Welcome back</h1>
            <p className="text-sm text-fg-muted mt-0.5">Sign in to your workspace.</p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={startGithubLogin}
            loading={githubLoading}
            loadingText="Redirecting..."
            fullWidth
            leftIcon={<Icon.Github className="h-4 w-4" />}
          >
            Continue with GitHub
          </Button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-fg-faint">
            <div className="h-px flex-1 bg-border-subtle" />
            <span>or</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          {error || authError ? <Alert variant="danger">{error ?? authError}</Alert> : null}

          <Button type="submit" loading={loading} loadingText="Signing in..." fullWidth>
            Sign in
          </Button>

          <div className="text-sm text-center text-fg-muted pt-1">
            No account?{" "}
            <Link href="/signup" className="text-brand-700 font-medium hover:text-brand-800">
              Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
