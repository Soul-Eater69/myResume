"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Topbar({ userName }: { userName: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="text-sm muted">Signed in as <span className="text-slate-900 font-medium">{userName}</span></div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
