"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Could not create account.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-subtle px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-md bg-brand-600 text-white flex items-center justify-center shadow-xs">
            <Icon.Bolt className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold text-fg">Open Resume</span>
        </Link>

        <form onSubmit={onSubmit} className="surface p-6 space-y-4">
          <div>
            <h1 className="text-lg font-semibold text-fg">Create your account</h1>
            <p className="text-sm text-fg-muted mt-0.5">Start building your career knowledge vault.</p>
          </div>

          <Field label="Full name" htmlFor="name">
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ada Lovelace"
            />
          </Field>

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

          <Field label="Password" hint="Minimum 8 characters." htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </Field>

          {error ? <Alert variant="danger">{error}</Alert> : null}

          <Button type="submit" loading={loading} loadingText="Creating…" fullWidth>
            Create account
          </Button>

          <div className="text-sm text-center text-fg-muted pt-1">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-700 font-medium hover:text-brand-800">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
