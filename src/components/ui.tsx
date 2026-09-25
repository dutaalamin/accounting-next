/**
 * Komponen UI — gaya modern SaaS.
 *
 * Prinsip:
 *  - Kartu membulat (rounded-xl) dengan shadow lembut, border sangat tipis
 *  - Tile KPI dengan ikon berwarna dalam kotak lembut
 *  - Tombol/input tinggi 40px (lebih nyaman disentuh)
 *  - Status memakai pill berwarna lembut
 */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// ============================ Page header ============================

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  action,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: string[];
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-sap-label">
            {breadcrumb.map((b, i) => (
              <span key={b} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-sap-border">/</span>}
                <span className={i === breadcrumb.length - 1 ? "text-sap-text" : ""}>{b}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-[26px] font-semibold tracking-tight text-sap-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-sap-label">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ============================ Button ============================

const BTN = {
  emphasized:
    "bg-sap-blue text-white shadow-sm shadow-sap-blue/25 hover:bg-sap-blue-dark",
  default:
    "border border-sap-border bg-white text-sap-text shadow-sm hover:bg-sap-hover",
  ghost: "text-sap-label hover:bg-sap-hover hover:text-sap-text",
  danger: "border border-sap-border bg-white text-sap-negative shadow-sm hover:bg-sap-negative-bg",
} as const;

export type ButtonVariant = keyof typeof BTN;

export function Button({
  children,
  variant = "emphasized",
  icon: Icon,
  type = "button",
  disabled,
  onClick,
  className = "",
  title,
}: {
  children?: ReactNode;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${BTN[variant]} ${className}`}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
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
      className={`rounded-2xl border border-sap-border bg-sap-card shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.12)] ${
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
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-sap-border-light px-5 py-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sap-blue-light text-sap-blue">
            <Icon size={17} strokeWidth={2} />
          </span>
        )}
        <div>
          <h2 className="text-sm font-semibold text-sap-text">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-sap-label">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ============================ Tile (KPI) ============================

const TILE_TONE = {
  blue: "bg-sap-blue-light text-sap-blue",
  positive: "bg-sap-positive-bg text-sap-positive",
  negative: "bg-sap-negative-bg text-sap-negative",
  critical: "bg-sap-critical-bg text-sap-critical",
  neutral: "bg-sap-neutral-bg text-sap-neutral",
} as const;

export type TileTone = keyof typeof TILE_TONE;

export function Tile({
  label,
  value,
  icon: Icon,
  tone = "blue",
  hint,
  accentBar = false,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: TileTone;
  hint?: string;
  accentBar?: boolean;
}) {
  void accentBar;
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-sap-border bg-sap-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.12)]">
      <div className="min-w-0">
        <p className="text-xs font-medium text-sap-label">{label}</p>
        <p className="mt-2 truncate text-[26px] font-semibold tracking-tight tabular-nums text-sap-text">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-sap-label">{hint}</p>}
      </div>
      {Icon && (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TILE_TONE[tone]}`}>
          <Icon size={20} strokeWidth={2} />
        </span>
      )}
    </div>
  );
}

// ============================ Pill (status) ============================

const INFO_TONE = {
  positive: "bg-sap-positive-bg text-sap-positive",
  negative: "bg-sap-negative-bg text-sap-negative",
  critical: "bg-sap-critical-bg text-sap-critical",
  blue: "bg-sap-blue-light text-sap-blue-dark",
  neutral: "bg-sap-neutral-bg text-sap-label",
} as const;

export type InfoTone = keyof typeof INFO_TONE;

export function InfoLabel({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: InfoTone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${INFO_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

// ============================ Table ============================

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-sm">{children}</table>
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
      className={`whitespace-nowrap border-b border-sap-border px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-sap-label sm:px-5 ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${className}`}
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
      className={`border-b border-sap-border-light px-3 py-3.5 text-sap-text sm:px-5 ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-lg bg-sap-neutral-bg px-2 py-1 font-mono text-xs font-medium text-sap-label">
      {children}
    </span>
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
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sap-neutral-bg text-sap-label">
              <Icon size={22} strokeWidth={1.8} />
            </span>
          )}
          <p className="text-sm font-medium text-sap-text">{title}</p>
          {description && <p className="mt-1 max-w-sm text-xs text-sap-label">{description}</p>}
        </div>
      </td>
    </tr>
  );
}

// ============================ Form field ============================

export const inputCls =
  "h-10 w-full rounded-xl border border-sap-border bg-white px-3.5 text-[13px] text-sap-text outline-none transition placeholder:text-sap-label focus:border-sap-blue focus:ring-4 focus:ring-sap-blue-light";

export const labelCls = "mb-1.5 block text-xs font-medium text-sap-label";
