"use client";

import { usePathname } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/accounts": "Akun & Dompet",
  "/journals": "Transaksi Harian",
  "/reports/arus-kas": "Arus Kas",
  "/reports/buku-besar": "Buku Besar",
  "/reports/laba-rugi": "Laba Rugi",
  "/reports/neraca": "Neraca",
};

export function Topbar({ userName, role }: { userName: string; role: string }) {
  const pathname = usePathname();
  const title =
    TITLES[pathname] ??
    (pathname.startsWith("/journals/") ? "Detail Jurnal" : "Accounting");

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-xl">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">
          {title}
        </p>
        <p className="text-sm font-semibold text-slate-800">Selamat datang kembali</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-slate-400 md:flex">
          <Search size={15} />
          <span className="text-xs">Cari…</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
            {userName.slice(0, 1).toUpperCase()}
          </span>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-slate-800">{userName}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{role}</p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            title="Keluar"
          >
            <LogOut size={17} />
          </button>
        </form>
      </div>
    </header>
  );
}
