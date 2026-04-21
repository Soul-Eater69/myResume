import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listRepos, listImportedRepoUrls } from "@/modules/github/service";
import { isLlmAvailableFor } from "@/modules/ai/provider";
import { isGithubOAuthConfigured } from "@/modules/auth/github-oauth";
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
  const llm = await isLlmAvailableFor(user.id);
  const oauthConfigured = isGithubOAuthConfigured();

  const summarizedCount = repos.filter((repo) => repo.summary).length;
  const importedCount = repos.filter((repo) => importedUrls.has(repo.htmlUrl)).length;

  return (
    <>
      <PageHeader
        title="GitHub"
        description="Import repositories as project evidence. Summaries stay review-needed until you verify them."
        actions={connected ? <SyncButton /> : null}
      />

      {!llm ? (
        <Alert variant="warning" title="Deterministic summary mode" className="mb-4">
          No AI provider key is configured - repo summaries fall back to README + metadata
          extraction. Configure Claude or GPT in <a href="/settings" className="underline">Settings</a>
          {" "}to enable AI bullet drafting.
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
                    <span className="text-fg-faint">-</span>
                    <span className="text-xs text-fg-subtle">
                      {repos.length} repos - {summarizedCount} summarized - {importedCount} imported
                    </span>
                  </>
                ) : null}
              </div>
              <CardDescription className="mt-2">
                Connect GitHub with OAuth to sync repos, summarize them, and import the best ones as project evidence.
              </CardDescription>
            </div>
          </div>
        </div>
        <div className="mt-4 max-w-xl">
          <ConnectForm connected={connected} oauthConfigured={oauthConfigured} />
        </div>
      </Card>

      {!connected ? (
        <Empty
          icon={<Icon.Github className="h-5 w-5" />}
          title="Connect GitHub to pull in repos"
          description={
            oauthConfigured
              ? "Once connected, we'll list your repositories so you can summarize and import them as projects."
              : "Add GitHub OAuth credentials to the server, then connect your account to sync repos."
          }
        />
      ) : repos.length === 0 ? (
        <Empty
          icon={<Icon.RefreshCw className="h-5 w-5" />}
          title="No repos synced yet"
          description="Run a sync to pull your most recent repositories."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {repos.map((repo) => {
            const languages = toStringArray(repo.languages);
            const bullets = repo.summary
              ? toStringArray(repo.summary.resumeReadyBullets)
              : [];
            const imported = importedUrls.has(repo.htmlUrl);
            return (
              <Card key={repo.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg hover:text-brand-700"
                    >
                      <span className="truncate">{repo.name}</span>
                      <Icon.ExternalLink className="h-3 w-3 text-fg-faint" />
                    </a>
                    <div className="text-xs text-fg-subtle mt-0.5 truncate">
                      {repo.fullName}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0 justify-end">
                    {repo.isPrivate ? <Badge variant="default">Private</Badge> : null}
                    {imported ? (
                      <Badge variant="verified" leftIcon={<Icon.Check className="h-3 w-3" />}>
                        Imported
                      </Badge>
                    ) : repo.summary ? (
                      <Badge variant="suggested">Summarized</Badge>
                    ) : (
                      <Badge variant="review">Not summarized</Badge>
                    )}
                  </div>
                </div>

                {repo.description ? (
                  <p className="text-sm text-fg-muted mt-2 line-clamp-2">{repo.description}</p>
                ) : null}

                {languages.length ? (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {languages.slice(0, 4).map((language) => (
                      <span className="chip" key={language}>{language}</span>
                    ))}
                  </div>
                ) : null}

                {repo.summary ? (
                  <div className="mt-3 rounded-md border border-border-subtle bg-surface-subtle/60 p-3">
                    <div className="text-xs font-medium text-fg-muted uppercase tracking-wide">
                      Summary
                    </div>
                    {repo.summary.summary ? (
                      <p className="text-sm text-fg mt-1.5 line-clamp-3">{repo.summary.summary}</p>
                    ) : null}
                    {bullets.length ? (
                      <ul className="text-xs text-fg-muted list-disc pl-4 mt-2 space-y-1">
                        {bullets.slice(0, 3).map((bullet, index) => (
                          <li key={index} className="line-clamp-2">{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-auto pt-3">
                  <RepoActions
                    repoId={repo.id}
                    hasSummary={Boolean(repo.summary)}
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

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === "string");
  return [];
}
