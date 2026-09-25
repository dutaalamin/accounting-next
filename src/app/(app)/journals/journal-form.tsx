"use client";

import { useActionState, useState } from "react";
import { createJournal, type JournalState } from "./actions";
import { formatRupiah } from "@/lib/format";
import type { AccountRow } from "@/lib/accounting/reports";

interface LineDraft {
  key: number;
  accountId: string;
  debit: string;
  credit: string;
  description: string;
}

let nextKey = 1;
function blankLine(): LineDraft {
  return { key: nextKey++, accountId: "", debit: "", credit: "", description: "" };
}

export function JournalForm({ accounts }: { accounts: AccountRow[] }) {
  const [state, formAction, pending] = useActionState<JournalState, FormData>(createJournal, {});
  const [lines, setLines] = useState<LineDraft[]>([blankLine(), blankLine()]);
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const diff = Math.round((totalDebit - totalCredit) * 100) / 100;
  const balanced = Math.abs(diff) < 0.01;

  function updateLine(key: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function payloadJson() {
    return JSON.stringify({
      referenceNumber: ref,
      date,
      description,
      lines: lines.map((l) => ({
        accountId: Number(l.accountId) || 0,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        description: l.description,
      })),
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="payload" value={payloadJson()} />

      {state.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Informasi Jurnal</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nomor Bukti</label>
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="mis. J-001"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Keterangan</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="mis. Beli perlengkapan kantor"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Rincian Debit / Kredit</h2>

        <div className="space-y-2">
          {lines.map((l) => (
            <div key={l.key} className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-4">
                <select
                  value={l.accountId}
                  onChange={(e) => updateLine(l.key, { accountId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">— Pilih Akun —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} · {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Debit"
                  value={l.debit}
                  onChange={(e) => updateLine(l.key, { debit: e.target.value, credit: "" })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Kredit"
                  value={l.credit}
                  onChange={(e) => updateLine(l.key, { credit: e.target.value, debit: "" })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLines((p) => p.filter((x) => x.key !== l.key))}
                  disabled={lines.length <= 2}
                  className="rounded-lg px-2 py-1 text-xs text-rose-600 transition hover:bg-rose-50 disabled:opacity-30"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setLines((p) => [...p, blankLine()])}
          className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          + Tambah Baris
        </button>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-slate-400">Total Debit: </span>
              <span className="font-semibold text-slate-800">{formatRupiah(totalDebit)}</span>
            </div>
            <div>
              <span className="text-slate-400">Total Kredit: </span>
              <span className="font-semibold text-slate-800">{formatRupiah(totalCredit)}</span>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              balanced
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {balanced ? "Balance" : `Selisih ${formatRupiah(Math.abs(diff))}`}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || !balanced}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Jurnal"}
      </button>
      {!balanced && (
        <p className="text-xs text-slate-500">
          Tombol simpan aktif setelah total debit = total kredit.
        </p>
      )}
    </form>
  );
}
