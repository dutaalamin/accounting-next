"use client";

import { useActionState, useState } from "react";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Scale,
  CalendarDays,
  FileText,
  Save,
} from "lucide-react";
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

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";
const labelCls = "mb-1.5 block text-xs font-medium text-slate-600";

export function JournalForm({ accounts }: { accounts: AccountRow[] }) {
  const [state, formAction, pending] = useActionState<JournalState, FormData>(createJournal, {});
  const [lines, setLines] = useState<LineDraft[]>([blankLine(), blankLine()]);
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const diff = Math.round((totalDebit - totalCredit) * 100) / 100;
  // Balance sejati = debit = kredit DAN nilainya tidak nol.
  const balanced = Math.abs(diff) < 0.01 && totalDebit > 0;

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
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} />
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} />
          {state.success}
        </div>
      )}

      {/* Informasi jurnal */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-indigo-500">
            <FileText size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Informasi Jurnal</h2>
            <p className="text-xs text-slate-500">Nomor bukti, tanggal, dan keterangan umum</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
          <div>
            <label className={labelCls}>Nomor Bukti</label>
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="J-001"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Tanggal</label>
            <div className="relative">
              <CalendarDays
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Keterangan</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Setoran modal awal"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Rincian debit/kredit */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-indigo-500">
              <Scale size={18} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Rincian Debit / Kredit</h2>
              <p className="text-xs text-slate-500">Total debit harus sama dengan total kredit</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              balanced ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${balanced ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            {balanced
              ? "Balance"
              : totalDebit === 0 && totalCredit === 0
                ? "Belum diisi"
                : `Selisih ${formatRupiah(Math.abs(diff))}`}
          </span>
        </div>

        <div className="space-y-2.5 p-5">
          {/* header kolom */}
          <div className="hidden grid-cols-12 gap-3 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 md:grid">
            <div className="col-span-4">Akun</div>
            <div className="col-span-3 text-right">Debit</div>
            <div className="col-span-3 text-right">Kredit</div>
            <div className="col-span-2" />
          </div>

          {lines.map((l, idx) => (
            <div key={l.key} className="grid grid-cols-12 items-center gap-3 rounded-xl bg-slate-50/60 p-2 md:bg-transparent md:p-0">
              <div className="col-span-12 md:col-span-4">
                <select
                  value={l.accountId}
                  onChange={(e) => updateLine(l.key, { accountId: e.target.value })}
                  className={inputCls}
                  aria-label={`Akun baris ${idx + 1}`}
                >
                  <option value="">— Pilih Akun —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} · {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-6 md:col-span-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={l.debit}
                  onChange={(e) => updateLine(l.key, { debit: e.target.value, credit: "" })}
                  className={`${inputCls} text-right tabular-nums`}
                  aria-label={`Debit baris ${idx + 1}`}
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={l.credit}
                  onChange={(e) => updateLine(l.key, { credit: e.target.value, debit: "" })}
                  className={`${inputCls} text-right tabular-nums`}
                  aria-label={`Kredit baris ${idx + 1}`}
                />
              </div>
              <div className="col-span-12 flex justify-end md:col-span-2">
                <button
                  type="button"
                  onClick={() => setLines((p) => p.filter((x) => x.key !== l.key))}
                  disabled={lines.length <= 2}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Hapus baris"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setLines((p) => [...p, blankLine()])}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600"
          >
            <Plus size={14} />
            Tambah Baris
          </button>
        </div>

        {/* Ringkasan total */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          <div className="flex gap-8">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Total Debit
              </p>
              <p className="text-base font-semibold tabular-nums text-slate-900">
                {formatRupiah(totalDebit)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Total Kredit
              </p>
              <p className="text-base font-semibold tabular-nums text-slate-900">
                {formatRupiah(totalCredit)}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending || !balanced}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={16} />
            {pending ? "Menyimpan…" : "Simpan Jurnal"}
          </button>
        </div>
      </div>
    </form>
  );
}
