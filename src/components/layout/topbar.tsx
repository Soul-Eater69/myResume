"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function Topbar({ userName, userEmail }: { userName: string; userEmail?: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="h-14 border-b border-border bg-white/80 backdrop-blur-sm flex items-center justify-end px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
            {initials || "U"}
          </div>
          <div className="leading-tight">
            <div className="text-xs font-medium text-fg">{userName}</div>
            {userEmail ? (
              <div className="text-2xs text-fg-subtle">{userEmail}</div>
            ) : null}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          leftIcon={<Icon.LogOut className="h-3.5 w-3.5" />}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
