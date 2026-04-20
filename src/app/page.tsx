import Link from "next/link";
import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/icon";

export default async function Home() {
  const uid = await getSessionUserId();
  if (uid) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="h-14 px-6 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-brand-600 text-white flex items-center justify-center shadow-xs">
            <Icon.Bolt className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-fg">Open Resume</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link className="btn btn-sm btn-ghost" href="/login">Sign in</Link>
          <Link className="btn btn-sm btn-primary" href="/signup">Create account</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 px-3 h-6 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-2xs font-medium mb-6">
            <Icon.Sparkles className="h-3 w-3" />
            Grounded. Versioned. Verified.
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-fg">
            Your career knowledge,<br className="hidden sm:block" /> tailored to every job.
          </h1>
          <p className="text-fg-muted mt-5 text-base md:text-lg max-w-2xl mx-auto">
            Store your full professional profile, paste a job description, and generate a
            grounded resume — with verified facts kept separate from AI suggestions.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn btn-lg btn-primary">
              Get started
              <Icon.ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn btn-lg btn-outline">Sign in</Link>
          </div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
            <FeatureCard
              icon={<Icon.User className="h-4 w-4" />}
              title="Profile vault"
              body="Every experience, project, and skill stored once — source of truth."
            />
            <FeatureCard
              icon={<Icon.Briefcase className="h-4 w-4" />}
              title="Job-aware tailoring"
              body="Signals extracted from each JD drive ranking and resume composition."
            />
            <FeatureCard
              icon={<Icon.Github className="h-4 w-4" />}
              title="GitHub evidence"
              body="Connect your repos and import them as reviewed project evidence."
            />
          </div>
        </div>
      </main>

      <footer className="px-6 py-5 border-t border-border text-xs text-fg-subtle flex flex-wrap items-center justify-between gap-2">
        <span>Open source career platform.</span>
        <span>Architecture: docs/resume-platform-guide.md</span>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="surface p-5">
      <div className="h-8 w-8 rounded-md bg-brand-50 text-brand-700 flex items-center justify-center mb-3 border border-brand-100">
        {icon}
      </div>
      <div className="text-sm font-semibold text-fg">{title}</div>
      <div className="text-xs text-fg-muted mt-1">{body}</div>
    </div>
  );
}
