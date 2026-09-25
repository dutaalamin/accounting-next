"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <div className="mb-6 flex justify-end print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-sap-blue px-4 text-[13px] font-medium text-white shadow-sm transition hover:bg-sap-blue-dark"
      >
        <Printer size={16} />
        Cetak / Simpan PDF
      </button>
    </div>
  );
}
