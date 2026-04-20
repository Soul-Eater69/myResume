import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAiSetting } from "@/modules/ai/settings";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { AiSettingsForm } from "./ai-form";

export default async function SettingsPage() {
  const user = await requireUser();
  const conn = await db.githubConnection.findUnique({ where: { userId: user.id } });
  const githubConnected = conn?.connectionStatus === "active";
  const ai = await getAiSetting(user.id);
  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Account details and integrations for this workspace."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardTitle>Account</CardTitle>
          <CardDescription className="mt-1">
            Your profile and sign-in identity.
          </CardDescription>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-fg truncate">{user.name}</div>
              <div className="text-xs text-fg-subtle truncate">{user.email}</div>
            </div>
          </div>
          <dl className="mt-5 divide-y divide-border-subtle border-t border-border-subtle text-sm">
            <Row label="User ID" value={<code className="text-xs">{user.id}</code>} />
            <Row
              label="Email"
              value={<span className="text-fg-muted">{user.email}</span>}
            />
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>AI provider</CardTitle>
              <CardDescription className="mt-1">
                Pick the model that powers signal extraction, parsing, summarization, and
                resume composition. Keys are encrypted at rest.
              </CardDescription>
            </div>
          </div>
          <div className="mt-5">
            <AiSettingsForm initial={ai} />
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <CardTitle>Integrations</CardTitle>
          <CardDescription className="mt-1">
            Connected services that feed evidence into your resumes.
          </CardDescription>
          <div className="mt-4 space-y-3">
            <IntegrationRow
              icon={<Icon.Github className="h-5 w-5" />}
              name="GitHub"
              status={githubConnected ? "success" : "neutral"}
              statusLabel={githubConnected ? "Connected" : "Not connected"}
              href="/github"
            />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>Security</CardTitle>
          <CardDescription className="mt-1">
            How we handle your tokens and personal data.
          </CardDescription>
          <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm">
            <Check>Personal access tokens are encrypted at rest.</Check>
            <Check>Provider API keys are encrypted with AES-256-GCM.</Check>
            <Check>Summaries stay review-needed until you verify them.</Check>
            <Check>AI-generated content is never published on your behalf.</Check>
          </ul>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="text-right min-w-0 truncate">{value}</dd>
    </div>
  );
}

function IntegrationRow({
  icon,
  name,
  status,
  statusLabel,
  href,
}: {
  icon: React.ReactNode;
  name: string;
  status: "success" | "neutral";
  statusLabel: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between gap-3 p-3 rounded-md border border-border-subtle hover:border-border hover:bg-surface-muted/60 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-md bg-surface-muted border border-border-subtle flex items-center justify-center text-fg-subtle">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-fg">{name}</div>
          <div className="text-xs text-fg-subtle flex items-center gap-1.5 mt-0.5">
            <StatusDot status={status} />
            {statusLabel}
          </div>
        </div>
      </div>
      <Icon.ChevronRight className="h-4 w-4 text-fg-faint" />
    </a>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-fg-muted">
      <Icon.CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-success-600" />
      <span>{children}</span>
    </li>
  );
}
