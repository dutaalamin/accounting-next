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
  HelpCircle,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/accounts", label: "Akun", icon: Wallet },
  { href: "/journals", label: "Transaksi", icon: PenLine },
];

const REPORTS: NavItem[] = [
  { href: "/reports/arus-kas", label: "Arus Kas", icon: TrendingUp },
  { href: "/reports/buku-besar", label: "Buku Besar", icon: BookOpen },
  { href: "/reports/laba-rugi", label: "Laba Rugi", icon: BarChart3 },
  { href: "/reports/neraca", label: "Neraca", icon: Scale },
];

export function ShellBar({ userName, role }: { userName: string; role: string }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-30">
      {/* Shell bar — biru tua SAP */}
      <div className="flex h-11 items-center justify-between gap-4 bg-sap-shell px-3 text-white">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-white/15 text-[11px] font-bold">
              A
            </span>
            <span className="text-[13px] font-semibold tracking-tight">Accounting</span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {[...PRIMARY, ...REPORTS].map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-11 items-center gap-1.5 px-3 text-[13px] transition-colors ${
                    active
                      ? "bg-white/15 font-semibold text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={15} strokeWidth={1.9} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <div className="mr-1 hidden h-7 items-center gap-2 rounded bg-white/10 px-2.5 lg:flex">
            <Search size={14} className="text-white/70" />
            <span className="text-xs text-white/60">Cari</span>
          </div>

          <button
            className="flex h-8 w-8 items-center justify-center rounded text-white/80 transition hover:bg-white/10 hover:text-white"
            title="Notifikasi"
          >
            <Bell size={16} />
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded text-white/80 transition hover:bg-white/10 hover:text-white"
            title="Bantuan"
          >
            <HelpCircle size={16} />
          </button>

          <div className="ml-1 flex h-8 items-center gap-2 rounded bg-white/10 pl-1 pr-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold">
              {userName.slice(0, 1).toUpperCase()}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-[11px] font-medium">{userName}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60">{role}</p>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              title="Keluar"
              className="flex h-8 w-8 items-center justify-center rounded text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Nav horizontal versi mobile */}
      <nav className="flex items-center gap-0.5 overflow-x-auto border-b border-sap-border bg-white px-2 md:hidden">
        {[...PRIMARY, ...REPORTS].map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] ${
                active
                  ? "border-sap-blue font-semibold text-sap-blue"
                  : "border-transparent text-sap-label"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
