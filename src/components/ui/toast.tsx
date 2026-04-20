"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

type ToastKind = "success" | "error" | "info" | "warning";
type Toast = { id: number; kind: ToastKind; title: string; description?: string; duration: number };

type ToastContext = {
  show: (t: { kind?: ToastKind; title: string; description?: string; duration?: number }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const Ctx = createContext<ToastContext | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({
      kind = "info",
      title,
      description,
      duration = 4000,
    }: {
      kind?: ToastKind;
      title: string;
      description?: string;
      duration?: number;
    }) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, kind, title, description, duration }]);
    },
    []
  );

  const api: ToastContext = {
    show,
    success: (t, d) => show({ kind: "success", title: t, description: d }),
    error: (t, d) => show({ kind: "error", title: t, description: d, duration: 6000 }),
    info: (t, d) => show({ kind: "info", title: t, description: d }),
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(22rem,calc(100vw-2rem))]"
      >
        {items.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (toast.duration <= 0) return;
    const h = setTimeout(onClose, toast.duration);
    return () => clearTimeout(h);
  }, [toast.duration, onClose]);

  const meta =
    toast.kind === "success" ? { icon: <Icon.CheckCircle className="h-4 w-4 text-success-600" />, ring: "border-success-100" }
    : toast.kind === "error" ? { icon: <Icon.Warning className="h-4 w-4 text-danger-600" />, ring: "border-danger-100" }
    : toast.kind === "warning" ? { icon: <Icon.Warning className="h-4 w-4 text-warning-600" />, ring: "border-warning-100" }
    : { icon: <Icon.Info className="h-4 w-4 text-brand-600" />, ring: "border-brand-100" };

  return (
    <div
      role="status"
      className={cn(
        "surface shadow-lg border animate-slide-up p-3 pr-9 flex gap-3 items-start relative",
        meta.ring
      )}
    >
      <div className="mt-0.5">{meta.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-fg">{toast.title}</div>
        {toast.description ? (
          <div className="text-xs text-fg-muted mt-0.5">{toast.description}</div>
        ) : null}
      </div>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 h-6 w-6 inline-flex items-center justify-center rounded text-fg-subtle hover:bg-surface-muted hover:text-fg"
        aria-label="Dismiss"
      >
        <Icon.X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    } as ToastContext;
  }
  return ctx;
}
