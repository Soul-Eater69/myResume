"use client";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
} from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn("input", error && "input-error", className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(function Textarea({ className, error, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn("textarea", error && "input-error", className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(function Select({ className, error, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn("input", error && "input-error", className)}
      {...props}
    />
  );
});

export function Label({
  className,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("label", className)} {...props}>
      {children}
    </label>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {label ? (
        <Label htmlFor={htmlFor}>{label}</Label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-danger-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  className,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className="inline-flex items-start gap-2 cursor-pointer select-none text-sm">
      <input
        type="checkbox"
        className={cn(
          "mt-0.5 h-4 w-4 rounded border-border text-brand-600 focus:ring-2 focus:ring-brand-500/30",
          className
        )}
        {...props}
      />
      {label ? <span className="text-fg">{label}</span> : null}
    </label>
  );
}

export function Radio({
  className,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm">
      <input
        type="radio"
        className={cn("h-4 w-4 border-border text-brand-600", className)}
        {...props}
      />
      {label ? <span className="text-fg">{label}</span> : null}
    </label>
  );
}
