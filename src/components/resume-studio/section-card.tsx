"use client";
import { useState, type ReactNode } from "react";

export function SectionCard({
  title,
  action,
  defaultOpen = true,
  children,
}: {
  title: string;
  action?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#242a35] last:border-b-0">
      <div className="flex items-center justify-between px-3 py-2.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#e5e7eb]"
        >
          <Chevron open={open} />
          {title}
        </button>
        {action}
      </div>
      {open ? <div className="px-3 pb-3 space-y-2.5">{children}</div> : null}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-[#9ca3af] transition-transform ${open ? "rotate-90" : ""}`}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function StudioInput({
  value,
  onChange,
  placeholder,
  className = "",
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={
        "w-full h-8 px-2.5 text-xs bg-[#0c1016] border border-[#242a35] rounded text-[#e5e7eb] placeholder:text-[#4b5563] focus:outline-none focus:border-emerald-600 transition-colors " +
        className
      }
    />
  );
}

export function StudioTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={
        "w-full px-2.5 py-1.5 text-xs bg-[#0c1016] border border-[#242a35] rounded text-[#e5e7eb] placeholder:text-[#4b5563] focus:outline-none focus:border-emerald-600 transition-colors leading-relaxed resize-y " +
        className
      }
    />
  );
}

export function StudioFieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] font-medium uppercase tracking-wider text-[#9ca3af] mb-1">
      {children}
    </div>
  );
}

export function StudioIconButton({
  onClick,
  title,
  children,
  className = "",
}: {
  onClick: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={
        "h-6 w-6 inline-flex items-center justify-center rounded text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1a2030] transition-colors " +
        className
      }
    >
      {children}
    </button>
  );
}

export function StudioGhostButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
    >
      <span className="text-[14px] leading-none">+</span> {children}
    </button>
  );
}
