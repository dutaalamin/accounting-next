"use client";

import { useActionState } from "react";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { createAccount, type AccountState } from "./actions";
import { ACCOUNT_TYPE_LABELS } from "@/db/coa";

const TYPES = Object.entries(ACCOUNT_TYPE_LABELS);

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";
const labelCls = "mb-1.5 block text-xs font-medium text-slate-600";

export function AccountForm() {
  const [state, formAction, pending] = useActionState<AccountState, FormData>(createAccount, {});

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)]">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">Tambah Akun Baru</h2>
        <p className="text-xs text-slate-500">
          Buat akun / dompet untuk mulai mencatat transaksi.
        </p>
      </div>

      <form action={formAction} className="p-5">
        {state.error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            <AlertCircle size={16} />
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
            <CheckCircle2 size={16} />
            {state.success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-2">
            <label htmlFor="code" className={labelCls}>
              Kode
            </label>
            <input id="code" name="code" required placeholder="111" className={inputCls} />
          </div>
          <div className="md:col-span-4">
            <label htmlFor="name" className={labelCls}>
              Nama Akun
            </label>
            <input id="name" name="name" required placeholder="Kas Kecil" className={inputCls} />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="type" className={labelCls}>
              Tipe
            </label>
            <select id="type" name="type" defaultValue="asset" className={inputCls}>
              {TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label htmlFor="initialBalance" className={labelCls}>
              Saldo Awal
            </label>
            <input
              id="initialBalance"
              name="initialBalance"
              type="number"
              step="0.01"
              defaultValue="0"
              className={inputCls}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          <Plus size={16} />
          {pending ? "Menyimpan…" : "Buat Akun"}
        </button>
      </form>
    </div>
  );
}
