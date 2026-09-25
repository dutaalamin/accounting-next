/**
 * Komponen UI bersama — dipakai di semua halaman supaya tampilan konsisten.
 */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// ============================ Page header ============================

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ============================ Card ============================

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  icon: Icon,
  accent = "text-indigo-500",
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  accent?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 ${accent}`}>
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ============================ Stat card ============================

const TONES = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100" },
  slate: { bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-200" },
} as const;

export type Tone = keyof typeof TONES;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
  hint,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: Tone;
  hint?: string;
}) {
  const t = TONES[tone];
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 truncate text-[22px] font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${t.bg} ${t.text} ${t.ring}`}
          >
            <Icon size={20} strokeWidth={2} />
          </span>
        )}
      </div>
    </Card>
  );
}

// ============================ Badge ============================

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${t.bg} ${t.text} ${t.ring}`}
    >
      {children}
    </span>
  );
}

// ============================ Table ============================

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={`border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 text-${align} ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
  colSpan,
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`border-b border-slate-50 px-4 py-3 text-${align} ${className}`}
    >
      {children}
    </td>
  );
}

// ============================ Empty state ============================

export function EmptyState({
  icon: Icon,
  title,
  description,
  colSpan,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14">
        <div className="flex flex-col items-center text-center">
          {Icon && (
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Icon size={22} strokeWidth={1.8} />
            </span>
          )}
          <p className="text-sm font-medium text-slate-700">{title}</p>
          {description && <p className="mt-1 max-w-sm text-xs text-slate-400">{description}</p>}
        </div>
      </td>
    </tr>
  );
}
