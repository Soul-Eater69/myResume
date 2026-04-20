import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

export function Stat({
  label,
  value,
  hint,
  href,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-fg-muted uppercase tracking-wide">{label}</div>
        {icon ? (
          <div className="h-7 w-7 rounded-md bg-surface-muted text-fg-subtle flex items-center justify-center">
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-semibold text-fg tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-fg-subtle">{hint}</div> : null}
      {href ? (
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 group-hover:text-brand-800">
          View <Icon.ArrowRight className="h-3.5 w-3.5" />
        </div>
      ) : null}
    </>
  );

  const base = "surface p-4 transition-colors group";
  if (href) {
    return (
      <Link href={href} className={cn(base, "hover:border-border-strong", className)}>
        {body}
      </Link>
    );
  }
  return <div className={cn(base, className)}>{body}</div>;
}
