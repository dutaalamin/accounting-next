/**
 * Komponen peringatan rentang tanggal tidak valid.
 */

import { AlertTriangle } from "lucide-react";

export function RangeWarning({ start, end }: { start: string; end: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-sap-critical/30 bg-sap-critical-bg px-4 py-3 text-[13px] text-sap-critical">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>
        Rentang tanggal tidak valid: <strong>{start}</strong> lebih besar dari{" "}
        <strong>{end}</strong>. Keduanya sudah ditukar otomatis agar laporan tetap benar.
      </span>
    </div>
  );
}
