"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import type { ReactNode } from "react";

type NavItem = { href: string; label: string; icon: (p: { className?: string }) => ReactNode };

const WORKSPACE: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Icon.Home },
  { href: "/profile", label: "Profile", icon: Icon.User },
  { href: "/jobs", label: "Jobs", icon: Icon.Briefcase },
  { href: "/applications", label: "Applications", icon: Icon.Kanban },
];

const INTEGRATIONS: NavItem[] = [
  { href: "/github", label: "GitHub", icon: Icon.Github },
];

const SYSTEM: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Icon.Settings },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-white h-screen sticky top-0 flex flex-col">
      <div className="px-4 h-14 flex items-center gap-2 border-b border-border">
        <div className="h-7 w-7 rounded-md bg-brand-600 text-white flex items-center justify-center shadow-xs">
          <Icon.Bolt className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-fg">Open Resume</span>
          <span className="text-2xs text-fg-subtle">Career platform</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 text-sm">
        <NavSection label="Workspace" items={WORKSPACE} />
        <NavSection label="Integrations" items={INTEGRATIONS} />
        <NavSection label="System" items={SYSTEM} />
      </nav>
      <div className="p-3 border-t border-border">
        <div className="rounded-md bg-surface-muted px-3 py-2.5">
          <div className="text-xs font-medium text-fg">AI suggestions</div>
          <div className="text-2xs text-fg-subtle mt-0.5">Verified vs suggested stays separated.</div>
        </div>
      </div>
    </aside>
  );
}

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <div>
      <div className="px-2 text-2xs font-medium uppercase tracking-wider text-fg-faint mb-1.5">
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const I = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 h-8 rounded-md transition-colors",
                active
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-fg-muted hover:bg-surface-muted hover:text-fg"
              )}
            >
              <I className={cn("h-4 w-4", active && "text-brand-600")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
