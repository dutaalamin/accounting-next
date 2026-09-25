"use client";

import { useActionState } from "react";
import { createAccount, type AccountState } from "./actions";
import { ACCOUNT_TYPE_LABELS } from "@/db/coa";

const TYPES = Object.entries(ACCOUNT_TYPE_LABELS);

export function AccountForm() {
  const [state, formAction, pending] = useActionState<AccountState, FormData>(createAccount, {});

  return (
    <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Tambah Akun Baru</h2>

      {state.error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label htmlFor="code" className="mb-1 block text-xs font-medium text-slate-600">
            Kode Akun
          </label>
          <input
            id="code"
            name="code"
            required
            placeholder="mis. 111"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="name" className="mb-1 block text-xs font-medium text-slate-600">
            Nama Akun
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="mis. Kas Kecil"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label htmlFor="type" className="mb-1 block text-xs font-medium text-slate-600">
            Tipe
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue="asset"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="initialBalance" className="mb-1 block text-xs font-medium text-slate-600">
            Saldo Awal
          </label>
          <input
            id="initialBalance"
            name="initialBalance"
            type="number"
            step="0.01"
            defaultValue="0"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Buat Akun Baru"}
      </button>
    </form>
  );
}
