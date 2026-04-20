"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

export function ConnectForm({ connected }: { connected: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState<"connect" | "disconnect" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    if (token.length < 20) {
      setError("Token looks too short (expected >= 20 chars).");
      return;
    }
    setError(null);
    setLoading("connect");
    const res = await fetch("/api/github/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data.message || "Could not save token.";
      setError(msg);
      toast.error("Connect failed", msg);
      return;
    }
    setToken("");
    toast.success(connected ? "Token updated" : "GitHub connected");
    router.refresh();
  }

  async function disconnect() {
    setLoading("disconnect");
    const res = await fetch("/api/github/connect", { method: "DELETE" });
    setLoading(null);
    if (res.ok) {
      toast.success("GitHub disconnected");
      router.refresh();
    } else {
      toast.error("Could not disconnect");
    }
  }

  return (
    <div className="space-y-3">
      <Field
        label="Personal access token"
        hint="Create a token with repo:read scope and paste it here."
        error={error ?? undefined}
      >
        <Input
          type="password"
          value={token}
          onChange={(e) => { setToken(e.target.value); setError(null); }}
          placeholder="ghp_…"
          error={Boolean(error)}
        />
      </Field>
      <div className="flex gap-2">
        <Button
          onClick={connect}
          disabled={!token}
          loading={loading === "connect"}
          loadingText="Saving…"
          leftIcon={<Icon.Link className="h-4 w-4" />}
        >
          {connected ? "Update token" : "Connect"}
        </Button>
        {connected ? (
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
        data.message || "GitHub may be rate-limiting or the token is invalid."
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
      loadingText="Syncing…"
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
        "AI unavailable — used README + metadata. Review bullets before import."
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
    toast.success("Imported to projects", "Review & verify on the Projects page.");
    router.refresh();
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={summarize}
        loading={loading === "summarize"}
        loadingText="Summarizing…"
        leftIcon={<Icon.Sparkles className="h-3.5 w-3.5" />}
      >
        {hasSummary ? "Re-summarize" : "Summarize"}
      </Button>
      <Button
        size="sm"
        onClick={importToProject}
        disabled={!hasSummary}
        loading={loading === "import"}
        loadingText="Importing…"
        leftIcon={imported ? <Icon.Check className="h-3.5 w-3.5" /> : <Icon.Plus className="h-3.5 w-3.5" />}
      >
        {imported ? "Re-import" : "Import to projects"}
      </Button>
    </div>
  );
}
