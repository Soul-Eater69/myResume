import type { ReactNode } from "react";

export function Empty({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-base font-medium">{title}</div>
      {description ? <div className="muted text-sm mt-1">{description}</div> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
