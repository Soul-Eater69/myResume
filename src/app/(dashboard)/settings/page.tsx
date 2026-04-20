import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLlmAvailable } from "@/modules/ai/provider";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

export default async function SettingsPage() {
  const user = await requireUser();
  const conn = await db.githubConnection.findUnique({ where: { userId: user.id } });
  const githubConnected = conn?.connectionStatus === "active";
  const llm = isLlmAvailable();
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Account details and integrations for this workspace."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
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

        <Card>
          <CardTitle>AI provider</CardTitle>
          <CardDescription className="mt-1">
            Claude powers signal extraction, parsing, summarization, and resume composition.
          </CardDescription>
          <div className="mt-4 space-y-3">
            <StatusRow
              icon={<Icon.Sparkles className="h-4 w-4" />}
              label="Status"
              status={llm ? "success" : "neutral"}
              value={
                <div className="flex items-center gap-2">
                  <span className="text-sm text-fg-muted">
                    {llm ? "Enabled" : "Disabled"}
                  </span>
                  {llm ? (
                    <Badge variant="verified">Live</Badge>
                  ) : (
                    <Badge variant="review">Rule-based fallback</Badge>
                  )}
                </div>
              }
            />
            <StatusRow
              icon={<Icon.Bolt className="h-4 w-4" />}
              label="Model"
              status="info"
              value={<code className="text-xs">{model}</code>}
            />
          </div>
          <div className="mt-4 rounded-md bg-surface-subtle border border-border-subtle p-3 text-xs text-fg-muted leading-relaxed">
            Set <code className="text-[11px]">ANTHROPIC_API_KEY</code> in your environment to
            enable AI flows. Without a key the system falls back to deterministic rule-based
            processing so the platform remains usable offline.
          </div>
        </Card>

        <Card>
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

        <Card>
          <CardTitle>Security</CardTitle>
          <CardDescription className="mt-1">
            How we handle your tokens and personal data.
          </CardDescription>
          <ul className="mt-4 space-y-2.5 text-sm">
            <Check>Personal access tokens are encrypted at rest.</Check>
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

function StatusRow({
  icon,
  label,
  status,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  status: "success" | "neutral" | "info" | "warning" | "danger";
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <span className="text-fg-subtle">{icon}</span>
        {label}
      </div>
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        {value}
      </div>
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
