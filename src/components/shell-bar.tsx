"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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
  LogOut,
  Users,
  Truck,
  Package,
  Receipt,
  FileText,
  UsersRound,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
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
    group: "Penjualan & Pembelian",
    items: [
      { href: "/customers", label: "Pelanggan", icon: Users },
      { href: "/customer-invoices", label: "Tagihan Pelanggan", icon: Receipt },
      { href: "/vendors", label: "Pemasok", icon: Truck },
      { href: "/supplier-invoices", label: "Tagihan Pemasok", icon: FileText },
      { href: "/products", label: "Produk & Layanan", icon: Package },
    ],
  },
  {
    group: "Pengaturan",
    items: [
      { href: "/profile", label: "Profil Saya", icon: UserCog },
      { href: "/users", label: "Kelola Pengguna", icon: UsersRound, adminOnly: true },
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

const STORAGE_KEY = "sidebar-collapsed";
const TOGGLE_EVENT = "sidebar-collapsed-change";

/**
 * Sumber kebenaran status sidebar = localStorage.
 * Dibaca lewat useSyncExternalStore supaya tidak ada setState di effect
 * (yang memicu peringatan react-hooks) dan tidak ada hydration mismatch.
 */
const collapsedStore = {
  subscribe(callback: () => void) {
    window.addEventListener("storage", callback);
    window.addEventListener(TOGGLE_EVENT, callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener(TOGGLE_EVENT, callback);
    };
  },
  getSnapshot(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  },
  getServerSnapshot(): boolean {
    return false;
  },
  set(value: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* localStorage tidak tersedia — abaikan */
    }
    window.dispatchEvent(new Event(TOGGLE_EVENT));
  },
};

function useCollapsed() {
  const collapsed = useSyncExternalStore(
    collapsedStore.subscribe,
    collapsedStore.getSnapshot,
    collapsedStore.getServerSnapshot,
  );
  const toggle = () => collapsedStore.set(!collapsed);
  return { collapsed, toggle };
}

function NavLinks({
  sections,
  collapsed,
  onNavigate,
}: {
  sections: { group: string; items: NavItem[] }[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
      {sections.map((section) => (
        <div key={section.group} className="mb-6">
          {collapsed ? (
            // Saat ter-minimize, nama grup diganti garis pemisah.
            <div className="mx-3 mb-3 border-t border-sap-border" />
          ) : (
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sap-label">
              {section.group}
            </p>
          )}
          <ul className="space-y-1">
            {section.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      active
                        ? "bg-sap-blue-light font-medium text-sap-blue-dark"
                        : "text-sap-label hover:bg-sap-hover hover:text-sap-text"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.2 : 1.9}
                      className={`shrink-0 ${
                        active ? "text-sap-blue" : "text-sap-label group-hover:text-sap-text"
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserBox({
  userName,
  role,
  collapsed,
}: {
  userName: string;
  role: string;
  collapsed: boolean;
}) {
  return (
    <div className="border-t border-sap-border p-3">
      <div
        className={`flex items-center gap-3 rounded-xl bg-sap-bg p-2.5 ${
          collapsed ? "flex-col" : ""
        }`}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white"
          title={collapsed ? `${userName} (${role})` : undefined}
        >
          {userName.slice(0, 1).toUpperCase()}
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-semibold text-sap-text">{userName}</p>
            <p className="text-[10px] uppercase tracking-wide text-sap-label">{role}</p>
          </div>
        )}
        <form action={logout}>
          <button
            type="submit"
            title="Keluar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sap-label transition hover:bg-sap-negative-bg hover:text-sap-negative"
          >
            <LogOut size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar({ userName, role }: { userName: string; role: string }) {
  const isAdminUser = role === "admin";
  const sections = NAV.map((s) => ({
    ...s,
    items: s.items.filter((i) => !i.adminOnly || isAdminUser),
  })).filter((s) => s.items.length > 0);

  const { collapsed, toggle } = useCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sembunyikan saat klik di luar / ganti halaman sudah ditangani NavLinks.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Lebar sidebar: 264px normal, 76px saat ter-minimize.
  const widthCls = collapsed ? "w-[76px]" : "w-[264px]";

  return (
    <>
      {/* Sidebar desktop */}
      <aside
        className={`group/side relative hidden shrink-0 flex-col border-r border-sap-border bg-white transition-[width] duration-200 lg:flex ${widthCls}`}
      >
        {/* Brand */}
        <div
          className={`flex h-[76px] items-center border-b border-sap-border ${
            collapsed ? "justify-center px-2" : "gap-3 px-5"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
            A
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-sap-text">Accounting</p>
              <p className="text-[11px] text-sap-label">Financial Suite</p>
            </div>
          )}
        </div>

        <NavLinks sections={sections} collapsed={collapsed} />
        <UserBox userName={userName} role={role} collapsed={collapsed} />

        {/* Tombol minimize — bulat, di tepi kanan & tengah tinggi sidebar */}
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "Perluas sidebar" : "Minimize sidebar"}
          aria-label={collapsed ? "Perluas sidebar" : "Minimize sidebar"}
          className="absolute -right-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-sap-border bg-white text-sap-label shadow-md transition hover:scale-105 hover:border-sap-blue hover:bg-sap-blue-light hover:text-sap-blue active:scale-95"
        >
          {collapsed ? (
            <ChevronRight size={20} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={20} strokeWidth={2.5} />
          )}
        </button>
      </aside>

      {/* Tombol buka sidebar (mobile) */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl bg-[#14161c] text-white shadow-lg lg:hidden"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar mobile (overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative flex h-full w-[264px] flex-col bg-white">
            <div className="flex h-[76px] items-center justify-between px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white">
                  A
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">Accounting</p>
                  <p className="text-[11px] text-sap-label">Financial Suite</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sap-label hover:bg-sap-hover hover:text-sap-text"
                aria-label="Tutup menu"
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks sections={sections} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <UserBox userName={userName} role={role} collapsed={false} />
          </div>
        </div>
      )}
    </>
  );
}
