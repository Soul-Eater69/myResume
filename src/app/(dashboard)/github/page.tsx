import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listRepos, listImportedRepoUrls } from "@/modules/github/service";
import { isLlmAvailable } from "@/modules/ai/provider";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Empty } from "@/components/ui/empty";
import { Icon } from "@/components/ui/icon";
import { ConnectForm, RepoActions, SyncButton } from "./client";

export default async function GithubPage() {
  const user = await requireUser();
  const conn = await db.githubConnection.findUnique({ where: { userId: user.id } });
  const connected = conn?.connectionStatus === "active";
  const [repos, importedUrls] = connected
    ? await Promise.all([listRepos(user.id), listImportedRepoUrls(user.id)])
    : [[] as Awaited<ReturnType<typeof listRepos>>, new Set<string>()];
  const llm = isLlmAvailable();

  const summarizedCount = repos.filter((r) => r.summary).length;
  const importedCount = repos.filter((r) => importedUrls.has(r.htmlUrl)).length;

  return (
    <>
      <PageHeader
        title="GitHub"
        description="Import repositories as project evidence. Summaries stay review-needed until you verify them."
        actions={connected ? <SyncButton /> : null}
      />

      {!llm ? (
        <Alert variant="warning" title="Deterministic summary mode" className="mb-4">
          <code className="text-xs">ANTHROPIC_API_KEY</code> isn&apos;t set — repo summaries fall back
          to README + metadata extraction. Add the key to enable AI bullet drafting.
        </Alert>
      ) : null}

      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-md bg-surface-muted border border-border-subtle flex items-center justify-center text-fg-subtle">
              <Icon.Github className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle>Connection</CardTitle>
              <div className="mt-1.5 flex items-center gap-2">
                <StatusDot status={connected ? "success" : "neutral"} />
                <span className="text-sm text-fg-muted">
                  {connected ? "Connected" : "Not connected"}
                </span>
                {connected ? (
                  <>
                    <span className="text-fg-faint">·</span>
                    <span className="text-xs text-fg-subtle">
                      {repos.length} repos · {summarizedCount} summarized · {importedCount} imported
                    </span>
                  </>
                ) : null}
              </div>
              <CardDescription className="mt-2">
                Create a GitHub personal access token with <code className="text-xs">repo</code> read
                scope and paste it here. Tokens are encrypted at rest.
              </CardDescription>
            </div>
          </div>
        </div>
        <div className="mt-4 max-w-xl">
          <ConnectForm connected={connected} />
        </div>
      </Card>

      {!connected ? (
        <Empty
          icon={<Icon.Github className="h-5 w-5" />}
          title="Connect GitHub to pull in repos"
          description="Once connected, we'll list your repositories so you can summarize and import them as projects."
        />
      ) : repos.length === 0 ? (
        <Empty
          icon={<Icon.RefreshCw className="h-5 w-5" />}
          title="No repos synced yet"
          description="Run a sync to pull your most recent repositories."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {repos.map((r) => {
            const languages = toStringArray(r.languages);
            const bullets = r.summary
              ? toStringArray(r.summary.resumeReadyBullets)
              : [];
            const imported = importedUrls.has(r.htmlUrl);
            return (
              <Card key={r.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <a
                      href={r.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg hover:text-brand-700"
                    >
                      <span className="truncate">{r.name}</span>
                      <Icon.ExternalLink className="h-3 w-3 text-fg-faint" />
                    </a>
                    <div className="text-xs text-fg-subtle mt-0.5 truncate">
                      {r.fullName}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0 justify-end">
                    {r.isPrivate ? <Badge variant="default">Private</Badge> : null}
                    {imported ? (
                      <Badge variant="verified" leftIcon={<Icon.Check className="h-3 w-3" />}>
                        Imported
                      </Badge>
                    ) : r.summary ? (
                      <Badge variant="suggested">Summarized</Badge>
                    ) : (
                      <Badge variant="review">Not summarized</Badge>
                    )}
                  </div>
                </div>

                {r.description ? (
                  <p className="text-sm text-fg-muted mt-2 line-clamp-2">{r.description}</p>
                ) : null}

                {languages.length ? (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {languages.slice(0, 4).map((l) => (
                      <span className="chip" key={l}>{l}</span>
                    ))}
                  </div>
                ) : null}

                {r.summary ? (
                  <div className="mt-3 rounded-md border border-border-subtle bg-surface-subtle/60 p-3">
                    <div className="text-xs font-medium text-fg-muted uppercase tracking-wide">
                      Summary
                    </div>
                    {r.summary.summary ? (
                      <p className="text-sm text-fg mt-1.5 line-clamp-3">{r.summary.summary}</p>
                    ) : null}
                    {bullets.length ? (
                      <ul className="text-xs text-fg-muted list-disc pl-4 mt-2 space-y-1">
                        {bullets.slice(0, 3).map((b, i) => (
                          <li key={i} className="line-clamp-2">{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-auto pt-3">
                  <RepoActions
                    repoId={r.id}
                    hasSummary={Boolean(r.summary)}
                    imported={imported}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}
