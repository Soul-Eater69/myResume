"use client";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  loadingText,
  fullWidth,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "primary" ? "btn-primary"
    : variant === "secondary" ? "btn-secondary"
    : variant === "outline" ? "btn-outline"
    : variant === "ghost" ? "btn-ghost"
    : "btn-danger";

  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "btn-md";

  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn("btn", sizeClass, variantClass, fullWidth && "w-full", className)}
      {...props}
    >
      {loading ? <Spinner /> : leftIcon}
      <span>{loading ? loadingText ?? children : children}</span>
      {!loading && rightIcon}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function IconButton({
  className,
  variant = "ghost",
  size = "md",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const variantClass =
    variant === "primary" ? "btn-primary"
    : variant === "secondary" ? "btn-secondary"
    : variant === "outline" ? "btn-outline"
    : variant === "ghost" ? "btn-ghost"
    : "btn-danger";
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-10 w-10" : "h-9 w-9";
  return (
    <button
      className={cn("btn p-0", dim, variantClass, className)}
      {...props}
    >
      {children}
    </button>
  );
}
