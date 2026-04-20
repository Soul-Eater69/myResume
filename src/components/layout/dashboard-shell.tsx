import type { ReactNode } from "react";
import Link from "next/link";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ToastProvider } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function DashboardShell({
  userName,
  userEmail,
  children,
}: {
  userName: string;
  userEmail?: string;
  children: ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-surface-subtle">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar userName={userName} userEmail={userEmail} />
          <main className="flex-1 px-6 py-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <div className={cn("mb-7", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="mb-2 flex items-center gap-1 text-xs text-fg-subtle">
          {breadcrumbs.map((b, i) => (
            <div key={i} className="flex items-center gap-1">
              {b.href ? (
                <Link href={b.href} className="hover:text-fg transition-colors">
                  {b.label}
                </Link>
              ) : (
                <span className="text-fg">{b.label}</span>
              )}
              {i < breadcrumbs.length - 1 ? (
                <Icon.ChevronRight className="h-3 w-3 text-fg-faint" />
              ) : null}
            </div>
          ))}
        </nav>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-fg tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-fg-muted mt-1 max-w-2xl">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3 mb-3", className)}>
      <div>
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {description ? (
          <p className="text-xs text-fg-muted mt-0.5">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
