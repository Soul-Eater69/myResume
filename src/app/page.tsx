import Link from "next/link";
import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const uid = await getSessionUserId();
  if (uid) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 py-5 flex items-center justify-between border-b border-slate-200">
        <div className="font-semibold text-brand-700">Open Resume</div>
        <div className="flex gap-3 text-sm">
          <Link className="btn-ghost" href="/login">Sign in</Link>
          <Link className="btn-primary" href="/signup">Create account</Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight">
            Your career knowledge, tailored to every job.
          </h1>
          <p className="muted mt-4 text-base">
            Store your full professional profile, paste a job description, and
            generate a grounded resume — with verified facts kept separate from
            AI suggestions.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/signup" className="btn-primary">Get started</Link>
            <Link href="/login" className="btn-outline">Sign in</Link>
          </div>
        </div>
      </main>
      <footer className="px-8 py-4 border-t border-slate-200 text-xs muted">
        Open source career platform. Built per the architecture in docs/resume-platform-guide.md.
      </footer>
    </div>
  );
}
