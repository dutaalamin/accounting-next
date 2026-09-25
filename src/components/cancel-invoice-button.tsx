"use client";

import { useActionState } from "react";
import { Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { CancelState } from "@/app/(app)/invoices/actions";

/**
 * Tombol pembatalan invoice dengan konfirmasi.
 * Hanya ditampilkan untuk admin (pemanggil yang menentukan).
 */
export function CancelInvoiceButton({
  id,
  kind,
  action,
  label,
}: {
  id: number;
  kind: "customer" | "supplier";
  action: (prev: CancelState, formData: FormData) => Promise<CancelState>;
  label: string;
}) {
  const [state, formAction, pending] = useActionState<CancelState, FormData>(action, {});

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          const ok = window.confirm(
            `Yakin membatalkan ${kind === "customer" ? "invoice" : "tagihan"} ini?\n\n` +
              "Jurnal akan dibatalkan lewat jurnal pembalik (jejak audit tetap ada)" +
              (kind === "customer" ? " dan stok dikembalikan." : "."),
          );
          if (!ok) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-sap-negative/40 bg-white px-4 text-[13px] font-medium text-sap-negative transition hover:bg-sap-negative-bg disabled:opacity-50"
        >
          <Trash2 size={15} />
          {pending ? "Membatalkan…" : label}
        </button>
      </form>

      {state.error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-sap-negative/30 bg-sap-negative-bg px-3.5 py-2.5 text-[13px] text-sap-negative">
          <AlertCircle size={15} />
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-sap-positive/30 bg-sap-positive-bg px-3.5 py-2.5 text-[13px] text-sap-positive">
          <CheckCircle2 size={15} />
          {state.success}
        </div>
      )}
    </div>
  );
}
