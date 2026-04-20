import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type Padding = "none" | "sm" | "md" | "lg";

const pad = (p: Padding) =>
  p === "none" ? "" : p === "sm" ? "p-4" : p === "lg" ? "p-6" : "p-5";

export function Card({
  className,
  padding = "md",
  ...props
}: HTMLAttributes<HTMLDivElement> & { padding?: Padding }) {
  return <div className={cn("surface", pad(padding), className)} {...props} />;
}

export function CardHeader({
  className,
  title,
  description,
  actions,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  if (title || description || actions) {
    return (
      <div
        className={cn(
          "flex items-start justify-between gap-4 mb-4",
          className
        )}
        {...props}
      >
        <div className="min-w-0">
          {title ? <h3 className="text-sm font-semibold text-fg">{title}</h3> : null}
          {description ? (
            <p className="text-sm text-fg-muted mt-0.5">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
    );
  }
  return (
    <div
      className={cn("flex items-center justify-between gap-3 mb-3", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-semibold text-fg tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-4 pt-4 flex items-center justify-between gap-3 border-t border-border-subtle",
        className
      )}
      {...props}
    />
  );
}

export function CardSection({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("py-3 border-t border-border-subtle first:border-0 first:pt-0", className)}
      {...props}
    />
  );
}
