"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

const GITHUB_CONNECT_URL =
  "/api/auth/github/start?intent=connect&returnTo=/github&errorReturnTo=/github";

export function ConnectForm({
  connected,
  oauthConfigured,
  githubLogin,
}: {
  connected: boolean;
  oauthConfigured: boolean;
  githubLogin?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState<"connect" | "disconnect" | null>(null);
  const [justDisconnected, setJustDisconnected] = useState(false);

  const githubError = searchParams.get("githubError");

  function connect() {
    if (!oauthConfigured) {
      toast.error(
        "GitHub OAuth not configured",
        "Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET on the server first."
      );
      return;
    }
    setLoading("connect");
    window.location.assign(GITHUB_CONNECT_URL);
  }

  async function disconnect() {
    setLoading("disconnect");
    const res = await fetch("/api/github/connect", { method: "DELETE" });
    setLoading(null);
    if (res.ok) {
      setJustDisconnected(true);
      router.refresh();
    } else {
      toast.error("Could not disconnect");
    }
  }

  return (
    <div className="space-y-3">
      {githubError ? <Alert variant="danger">{githubError}</Alert> : null}

      {justDisconnected ? (
        <Alert variant="info" title="Disconnected">
          GitHub has been unlinked.{" "}
          <strong>To connect a different account</strong>, sign out of{" "}
          <a href="https://github.com/logout" target="_blank" rel="noreferrer" className="underline">
            GitHub.com
          </a>{" "}
          first, then click Connect.
        </Alert>
      ) : !oauthConfigured ? (
        <Alert variant="warning" title="GitHub OAuth not configured">
          Add <code>GITHUB_CLIENT_ID</code> and <code>GITHUB_CLIENT_SECRET</code> to the server
          environment to enable one-click GitHub connect.
        </Alert>
      ) : connected ? (
        <Alert variant="info" title="Switching GitHub accounts?">
          GitHub keeps you signed in across apps. To connect a <strong>different account</strong>,
          disconnect below, sign out of{" "}
          <a href="https://github.com/logout" target="_blank" rel="noreferrer" className="underline">
            GitHub.com
          </a>
          , then reconnect.
          {githubLogin ? (
            <span className="block mt-1 text-xs text-fg-muted">
              Currently linked: <strong>@{githubLogin}</strong>
            </span>
          ) : null}
        </Alert>
      ) : (
        <Alert variant="info" title="Connect with GitHub OAuth">
          We request GitHub access through OAuth and store the returned token encrypted at rest.
          No personal access token needs to be pasted into the app.
        </Alert>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={connect}
          disabled={!oauthConfigured}
          loading={loading === "connect"}
          loadingText="Redirecting to GitHub…"
          leftIcon={<Icon.Github className="h-4 w-4" />}
        >
          {connected && !justDisconnected ? "Reconnect GitHub" : "Connect with GitHub"}
        </Button>
        {connected && !justDisconnected ? (
          <Button
            variant="outline"
            onClick={disconnect}
            loading={loading === "disconnect"}
            loadingText="Disconnecting…"
          >
            Disconnect
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function SyncButton() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const res = await fetch("/api/github/sync", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(
        "Sync failed",
        data.message || "GitHub access may have expired. Reconnect and try again."
      );
      return;
    }
    const data = await res.json().catch(() => ({}));
    toast.success(
      `Synced ${data.count ?? ""} repos`.trim(),
      "Summarize any repo to prepare it for import."
    );
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      loading={loading}
      loadingText="Syncing..."
      leftIcon={<Icon.RefreshCw className="h-3.5 w-3.5" />}
    >
      Sync repos
    </Button>
  );
}

export function RepoActions({
  repoId,
  hasSummary,
  imported,
}: {
  repoId: string;
  hasSummary: boolean;
  imported?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState<"summarize" | "import" | null>(null);

  async function summarize() {
    setLoading("summarize");
    const res = await fetch(`/api/github/repos/${repoId}/summarize`, { method: "POST" });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error("Could not summarize", data.message || "Try again.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (data?.fallback) {
      toast.info(
        "Deterministic summary",
        "AI unavailable - used README + metadata. Review bullets before import."
      );
    } else {
      toast.success("Summary ready");
    }
    router.refresh();
  }

  async function importToProject() {
    setLoading("import");
    const res = await fetch(`/api/github/repos/${repoId}/import-to-projects`, { method: "POST" });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error("Import failed", data.message || "Summarize the repo first.");
      return;
    }
    toast.success("Imported to projects", "Review and verify on the Projects page.");
    router.refresh();
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={summarize}
        loading={loading === "summarize"}
        loadingText="Summarizing..."
        leftIcon={<Icon.Sparkles className="h-3.5 w-3.5" />}
      >
        {hasSummary ? "Re-summarize" : "Summarize"}
      </Button>
      <Button
        size="sm"
        onClick={importToProject}
        disabled={!hasSummary}
        loading={loading === "import"}
        loadingText="Importing..."
        leftIcon={imported ? <Icon.Check className="h-3.5 w-3.5" /> : <Icon.Plus className="h-3.5 w-3.5" />}
      >
        {imported ? "Re-import" : "Import to projects"}
      </Button>
    </div>
  );
}
