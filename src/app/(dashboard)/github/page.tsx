import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listRepos } from "@/modules/github/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ConnectForm, RepoActions, SyncButton } from "./client";
import { Badge } from "@/components/ui/badge";

export default async function GithubPage() {
  const user = await requireUser();
  const conn = await db.githubConnection.findUnique({ where: { userId: user.id } });
  const repos = conn?.connectionStatus === "active" ? await listRepos(user.id) : [];

  return (
    <>
      <PageHeader
        title="GitHub"
        description="Import repositories as project evidence. Imports stay review-needed until you verify them."
      />

      <Card className="mb-4">
        <CardTitle>Connection</CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={conn?.connectionStatus === "active" ? "verified" : "review"}>
            {conn?.connectionStatus ?? "not connected"}
          </Badge>
          {conn?.connectionStatus === "active" ? <SyncButton /> : null}
        </div>
        <CardDescription className="mt-3">
          Create a GitHub personal access token with <code>repo</code> read scope and paste it here.
        </CardDescription>
        <div className="mt-3 max-w-xl">
          <ConnectForm connected={conn?.connectionStatus === "active"} />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {repos.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-sm muted">{r.description ?? "—"}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(r.languages as string[] | null)?.slice(0, 4).map((l) => (
                    <span className="badge" key={l}>{l}</span>
                  ))}
                </div>
                {r.summary ? (
                  <>
                    <div className="text-sm mt-3">{r.summary.summary}</div>
                    <ul className="text-xs list-disc pl-5 mt-2 space-y-0.5">
                      {((r.summary.resumeReadyBullets as string[] | null) ?? []).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </div>
            <div className="mt-3">
              <RepoActions repoId={r.id} hasSummary={Boolean(r.summary)} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
