"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    group: "Buku Besar",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/accounts", label: "Daftar Akun / Dompet" },
      { href: "/journals", label: "Catat Transaksi Harian" },
    ],
  },
  {
    group: "Laporan Keuangan",
    items: [
      { href: "/reports/arus-kas", label: "Arus Kas (Cash Flow)" },
      { href: "/reports/buku-besar", label: "Buku Besar (General Ledger)" },
      { href: "/reports/laba-rugi", label: "Laba Rugi (Income Statement)" },
      { href: "/reports/neraca", label: "Neraca (Balance Sheet)" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          A
        </div>
        <span className="font-bold text-slate-900">Accounting</span>
      </div>

      <nav className="p-3">
        {NAV.map((section) => (
          <div key={section.group} className="mb-4">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {section.group}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
