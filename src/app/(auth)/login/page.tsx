"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
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

          {error ? <Alert variant="danger">{error}</Alert> : null}

          <Button type="submit" loading={loading} loadingText="Signing in…" fullWidth>
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
