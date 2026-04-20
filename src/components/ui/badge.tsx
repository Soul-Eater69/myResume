import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "verified" | "suggested" | "review";
}) {
  const cls =
    variant === "verified"
      ? "badge-verified"
      : variant === "suggested"
      ? "badge-suggested"
      : variant === "review"
      ? "badge-review"
      : "badge";
  return <span className={cn(cls, className)} {...props} />;
}
