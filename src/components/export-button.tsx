"use client";

import { Download } from "lucide-react";

/**
 * Tombol unduh CSV. Memakai <a download> biasa supaya browser yang
 * menangani unduhan (cookie sesi ikut terkirim).
 */
export function ExportButton({
  type,
  label = "Ekspor CSV",
}: {
  type: string;
  label?: string;
}) {
  return (
    <a
      href={`/api/export/${type}`}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-sap-border bg-white px-4 text-[13px] font-medium text-sap-text shadow-sm transition hover:bg-sap-hover"
    >
      <Download size={16} />
      {label}
    </a>
  );
}
