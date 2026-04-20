import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Empty({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface p-10 text-center flex flex-col items-center", className)}>
      {icon ? (
        <div className="mb-4 h-10 w-10 flex items-center justify-center rounded-full bg-surface-muted text-fg-subtle">
          {icon}
        </div>
      ) : null}
      <div className="text-sm font-semibold text-fg">{title}</div>
      {description ? (
        <div className="text-sm text-fg-muted mt-1 max-w-sm">{description}</div>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
