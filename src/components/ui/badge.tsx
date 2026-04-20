import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type Variant = "default" | "brand" | "verified" | "suggested" | "review" | "danger";

export function Badge({
  className,
  variant = "default",
  leftIcon,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant; leftIcon?: ReactNode }) {
  const cls =
    variant === "verified" ? "badge-verified"
    : variant === "suggested" ? "badge-suggested"
    : variant === "review" ? "badge-review"
    : variant === "brand" ? "badge-brand"
    : variant === "danger" ? "badge-danger"
    : "badge";
  return (
    <span className={cn(cls, className)} {...props}>
      {leftIcon}
      {children}
    </span>
  );
}

export function StatusDot({
  status = "neutral",
  className,
}: {
  status?: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const color =
    status === "success" ? "bg-success-500"
    : status === "warning" ? "bg-warning-500"
    : status === "danger" ? "bg-danger-500"
    : status === "info" ? "bg-brand-500"
    : "bg-fg-faint";
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        color,
        className
      )}
      aria-hidden="true"
    />
  );
}
