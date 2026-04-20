"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ConnectForm({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function connect() {
    setLoading(true);
    await fetch("/api/github/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setLoading(false);
    setToken("");
    router.refresh();
  }

  async function disconnect() {
    await fetch("/api/github/connect", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Label>Personal access token</Label>
      <Input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="ghp_..."
      />
      <div className="flex gap-2">
        <Button onClick={connect} disabled={!token || loading}>
          {connected ? "Update token" : "Connect"}
        </Button>
        {connected ? (
          <Button variant="outline" onClick={disconnect}>
            Disconnect
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function onClick() {
    setLoading(true);
    await fetch("/api/github/sync", { method: "POST" });
    setLoading(false);
    router.refresh();
  }
  return (
    <Button variant="outline" onClick={onClick} disabled={loading}>
      {loading ? "Syncing…" : "Sync repos"}
    </Button>
  );
}

export function RepoActions({ repoId, hasSummary }: { repoId: string; hasSummary: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"summarize" | "import" | null>(null);

  async function summarize() {
    setLoading("summarize");
    await fetch(`/api/github/repos/${repoId}/summarize`, { method: "POST" });
    setLoading(null);
    router.refresh();
  }
  async function importToProject() {
    setLoading("import");
    await fetch(`/api/github/repos/${repoId}/import-to-projects`, { method: "POST" });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={summarize} disabled={loading !== null}>
        {loading === "summarize" ? "Summarizing…" : hasSummary ? "Re-summarize" : "Summarize"}
      </Button>
      <Button onClick={importToProject} disabled={!hasSummary || loading !== null}>
        {loading === "import" ? "Importing…" : "Import to projects"}
      </Button>
    </div>
  );
}
