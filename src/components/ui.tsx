/**
 * Komponen UI — gaya SAP Fiori.
 *
 * Prinsip SAP Fiori yang diikuti:
 *  - Kartu berbingkai tipis (1px), sudut 8px, TANPA bayangan tebal
 *  - Tabel "grid" rapat: header abu #f5f6f7, baris 40px, garis tipis
 *  - Tombol tinggi 32px, sudut 4px; primary = biru SAP #0a6ed1
 *  - Status memakai InfoLabel (teks berwarna + latar tipis), bukan badge bulat
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
    <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-1 flex items-center gap-1.5 text-xs text-sap-label">
            {breadcrumb.map((b, i) => (
              <span key={b} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-sap-border">/</span>}
                <span className={i === breadcrumb.length - 1 ? "text-sap-text" : ""}>{b}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-sap-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-sap-label">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ============================ Button ============================

const BTN = {
  emphasized:
    "bg-sap-blue text-white hover:bg-sap-blue-dark focus-visible:outline-sap-blue",
  default:
    "border border-sap-blue text-sap-blue bg-white hover:bg-sap-blue-light focus-visible:outline-sap-blue",
  ghost:
    "border border-sap-border text-sap-text bg-white hover:bg-sap-hover focus-visible:outline-sap-blue",
  danger:
    "border border-sap-negative text-sap-negative bg-white hover:bg-sap-negative-bg",
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
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded px-3 text-[13px] font-normal transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${BTN[variant]} ${className}`}
    >
      {Icon && <Icon size={15} strokeWidth={1.9} />}
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
      className={`rounded-lg border border-sap-border bg-sap-card ${padded ? "p-4" : ""} ${className}`}
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
    <div className="flex items-start justify-between gap-3 border-b border-sap-border-light px-4 py-3">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={16} strokeWidth={2} className="text-sap-blue" />}
        <div>
          <h2 className="text-sm font-semibold text-sap-text">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-sap-label">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ============================ Tile (SAP KPI) ============================

const TILE_TONE = {
  blue: { icon: "text-sap-blue", bar: "bg-sap-blue" },
  positive: { icon: "text-sap-positive", bar: "bg-sap-positive" },
  negative: { icon: "text-sap-negative", bar: "bg-sap-negative" },
  critical: { icon: "text-sap-critical", bar: "bg-sap-critical" },
  neutral: { icon: "text-sap-neutral", bar: "bg-sap-neutral" },
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
  const t = TILE_TONE[tone];
  return (
    <div className="relative flex overflow-hidden rounded-lg border border-sap-border bg-sap-card">
      {accentBar && <span className={`w-1.5 shrink-0 ${t.bar}`} />}
      <div className="flex flex-1 items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sap-label">
            {label}
          </p>
          <p className="mt-1.5 truncate text-2xl font-semibold tabular-nums text-sap-text">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-sap-label">{hint}</p>}
        </div>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-sap-neutral-bg">
            <Icon size={18} strokeWidth={1.9} className={t.icon} />
          </span>
        )}
      </div>
    </div>
  );
}

// ============================ InfoLabel (status) ============================

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
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${INFO_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

// ============================ Table (SAP grid) ============================

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">{children}</table>
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
      className={`h-9 border-b border-sap-border bg-sap-header px-3 text-[11px] font-semibold uppercase tracking-wide text-sap-label ${
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
      className={`h-10 border-b border-sap-border-light px-3 text-sap-text ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-sap-border-light bg-sap-neutral-bg px-1.5 py-0.5 font-mono text-xs text-sap-label">
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
      <td colSpan={colSpan} className="px-4 py-12">
        <div className="flex flex-col items-center text-center">
          {Icon && <Icon size={30} strokeWidth={1.5} className="mb-3 text-sap-border" />}
          <p className="text-sm font-medium text-sap-text">{title}</p>
          {description && <p className="mt-1 max-w-sm text-xs text-sap-label">{description}</p>}
        </div>
      </td>
    </tr>
  );
}

// ============================ Form field ============================

export const inputCls =
  "h-8 w-full rounded border border-[#89919a] bg-white px-2.5 text-[13px] text-sap-text outline-none transition placeholder:text-sap-label focus:border-sap-blue focus:ring-1 focus:ring-sap-blue";

export const labelCls = "mb-1 block text-xs font-medium text-sap-label";
