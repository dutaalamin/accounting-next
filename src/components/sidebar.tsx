"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  PenLine,
  TrendingUp,
  BookOpen,
  BarChart3,
  Scale,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    group: "Buku Besar",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/accounts", label: "Akun & Dompet", icon: Wallet },
      { href: "/journals", label: "Transaksi Harian", icon: PenLine },
    ],
  },
  {
    group: "Laporan",
    items: [
      { href: "/reports/arus-kas", label: "Arus Kas", icon: TrendingUp },
      { href: "/reports/buku-besar", label: "Buku Besar", icon: BookOpen },
      { href: "/reports/laba-rugi", label: "Laba Rugi", icon: BarChart3 },
      { href: "/reports/neraca", label: "Neraca", icon: Scale },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[268px] shrink-0 flex-col border-r border-[#1b1e24] bg-[#0a0b0e] text-[#8b929c]">
      {/* Brand */}
      <div className="flex h-[72px] items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
          A
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Accounting</p>
          <p className="text-[11px] text-slate-500">Financial Suite</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV.map((section) => (
          <div key={section.group} className="mb-6">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              {section.group}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                        active
                          ? "bg-white/[0.08] font-medium text-white shadow-sm"
                          : "text-[#8b929c] hover:bg-white/[0.04] hover:text-[#e8eaed]"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500" />
                      )}
                      <Icon
                        size={18}
                        strokeWidth={active ? 2.2 : 1.8}
                        className={active ? "text-indigo-400" : "text-[#5b616b] group-hover:text-[#a5abb4]"}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 px-6 py-4">
        <p className="text-[11px] text-[#4b515b]">v0.1 · Next.js</p>
      </div>
    </aside>
  );
}
