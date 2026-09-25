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
  Search,
  Bell,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Buku Besar",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/accounts", label: "Akun & Dompet", icon: Wallet },
      { href: "/journals", label: "Transaksi", icon: PenLine },
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

export function Sidebar({ userName, role }: { userName: string; role: string }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside className="flex w-[264px] shrink-0 flex-col bg-gradient-to-b from-[#1e1b4b] to-[#2e1065]">
      {/* Brand */}
      <div className="flex h-[76px] items-center gap-3 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 text-sm font-bold text-white shadow-lg shadow-violet-900/40">
          A
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Accounting</p>
          <p className="text-[11px] text-indigo-300/70">Financial Suite</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV.map((section) => (
          <div key={section.group} className="mb-6">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-300/50">
              {section.group}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                        active
                          ? "bg-white/[0.12] font-medium text-white shadow-sm"
                          : "text-indigo-200/70 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <Icon
                        size={18}
                        strokeWidth={active ? 2.2 : 1.9}
                        className={active ? "text-indigo-300" : "text-indigo-300/60 group-hover:text-indigo-200"}
                      />
                      {item.label}
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-300" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-semibold text-white">
            {userName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-semibold text-white">{userName}</p>
            <p className="text-[10px] uppercase tracking-wide text-indigo-300/60">{role}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Keluar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-200/70 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/accounts": "Akun & Dompet",
  "/journals": "Transaksi",
  "/reports/arus-kas": "Arus Kas",
  "/reports/buku-besar": "Buku Besar",
  "/reports/laba-rugi": "Laba Rugi",
  "/reports/neraca": "Neraca",
};

export function Topbar() {
  const pathname = usePathname();
  const title =
    TITLES[pathname] ?? (pathname.startsWith("/journals/") ? "Detail Jurnal" : "Accounting");

  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-4 border-b border-sap-border bg-white/80 px-6 backdrop-blur-xl">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-sap-label">
          {title}
        </p>
        <p className="text-sm font-semibold text-sap-text">Selamat datang kembali</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden h-10 items-center gap-2 rounded-xl border border-sap-border bg-sap-bg px-3.5 text-sap-label md:flex">
          <Search size={15} />
          <span className="text-xs">Cari…</span>
        </div>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-sap-border bg-white text-sap-label transition hover:bg-sap-hover hover:text-sap-text"
          title="Notifikasi"
        >
          <Bell size={17} />
        </button>
      </div>
    </header>
  );
}
