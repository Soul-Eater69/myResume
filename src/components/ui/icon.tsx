import { cn } from "@/lib/utils";

type IconProps = { className?: string };

const svg = (path: React.ReactNode, props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-4 w-4 shrink-0", props.className)}
    aria-hidden="true"
  >
    {path}
  </svg>
);

export const Icon = {
  Home: (p: IconProps) => svg(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>, p),
  User: (p: IconProps) => svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>, p),
  Briefcase: (p: IconProps) => svg(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>, p),
  Github: (p: IconProps) => svg(<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.71.11 2.5.33 1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.91.68 1.83v2.72c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />, p),
  Kanban: (p: IconProps) => svg(<><rect x="3" y="4" width="5" height="12" rx="1.5" /><rect x="10" y="4" width="5" height="16" rx="1.5" /><rect x="17" y="4" width="4" height="8" rx="1.5" /></>, p),
  Settings: (p: IconProps) => svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.86l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.86-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.86.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.86l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.86.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.86-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .66.39 1.27 1 1.56H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" /></>, p),
  FileText: (p: IconProps) => svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8M8 9h2" /></>, p),
  Plus: (p: IconProps) => svg(<><path d="M12 5v14M5 12h14" /></>, p),
  Check: (p: IconProps) => svg(<path d="m4.5 12.5 5 5 10-11" />, p),
  X: (p: IconProps) => svg(<><path d="M18 6 6 18M6 6l12 12" /></>, p),
  ArrowRight: (p: IconProps) => svg(<><path d="M5 12h14M13 5l7 7-7 7" /></>, p),
  ArrowLeft: (p: IconProps) => svg(<><path d="M19 12H5M11 5l-7 7 7 7" /></>, p),
  Sparkles: (p: IconProps) => svg(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></>, p),
  Trash: (p: IconProps) => svg(<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" /><path d="M10 11v6M14 11v6" /></>, p),
  Upload: (p: IconProps) => svg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></>, p),
  Download: (p: IconProps) => svg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>, p),
  ExternalLink: (p: IconProps) => svg(<><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M21 13v8H3V3h8" /></>, p),
  LogOut: (p: IconProps) => svg(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>, p),
  RefreshCw: (p: IconProps) => svg(<><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>, p),
  Link: (p: IconProps) => svg(<><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7" /></>, p),
  Search: (p: IconProps) => svg(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>, p),
  Info: (p: IconProps) => svg(<><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></>, p),
  Warning: (p: IconProps) => svg(<><path d="M12 3 2 21h20L12 3Z" /><path d="M12 10v4M12 18h.01" /></>, p),
  CheckCircle: (p: IconProps) => svg(<><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 5-5" /></>, p),
  Circle: (p: IconProps) => svg(<circle cx="12" cy="12" r="9" />, p),
  ChevronRight: (p: IconProps) => svg(<path d="m9 6 6 6-6 6" />, p),
  ChevronDown: (p: IconProps) => svg(<path d="m6 9 6 6 6-6" />, p),
  Dot: (p: IconProps) => svg(<circle cx="12" cy="12" r="2" fill="currentColor" />, p),
  Bolt: (p: IconProps) => svg(<path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" />, p),
  Pencil: (p: IconProps) => svg(<><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>, p),
};
