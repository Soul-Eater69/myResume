import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

type Variant = "info" | "success" | "warning" | "danger";

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: Variant;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const styles =
    variant === "success" ? { wrap: "bg-success-50 border-success-100 text-success-700", Icon: Icon.CheckCircle }
    : variant === "warning" ? { wrap: "bg-warning-50 border-warning-100 text-warning-700", Icon: Icon.Warning }
    : variant === "danger" ? { wrap: "bg-danger-50 border-danger-100 text-danger-700", Icon: Icon.Warning }
    : { wrap: "bg-brand-50 border-brand-100 text-brand-700", Icon: Icon.Info };
  const I = styles.Icon;
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn("rounded-md border px-3.5 py-3 flex gap-2.5 items-start text-sm", styles.wrap, className)}
    >
      <I className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="min-w-0">
        {title ? <div className="font-medium">{title}</div> : null}
        {children ? <div className={cn("leading-5", title && "mt-0.5 opacity-90")}>{children}</div> : null}
      </div>
    </div>
  );
}
