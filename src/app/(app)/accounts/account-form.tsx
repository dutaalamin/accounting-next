"use client";

import { useActionState } from "react";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { createAccount, type AccountState } from "./actions";
import { ACCOUNT_TYPE_LABELS } from "@/db/coa";
import { Card, CardHeader, Button, inputCls, labelCls } from "@/components/ui";

const TYPES = Object.entries(ACCOUNT_TYPE_LABELS);

export function AccountForm() {
  const [state, formAction, pending] = useActionState<AccountState, FormData>(createAccount, {});

  return (
    <Card padded={false}>
      <CardHeader
        title="Tambah Akun Baru"
        description="Buat akun / dompet untuk mulai mencatat transaksi"
        icon={Plus}
      />
      <form action={formAction} className="p-4">
        {state.error && (
          <div className="mb-3 flex items-center gap-2 rounded border border-sap-negative/30 bg-sap-negative-bg px-3 py-2 text-[13px] text-sap-negative">
            <AlertCircle size={15} />
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="mb-3 flex items-center gap-2 rounded border border-sap-positive/30 bg-sap-positive-bg px-3 py-2 text-[13px] text-sap-positive">
            <CheckCircle2 size={15} />
            {state.success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
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

        <div className="mt-4">
          <Button type="submit" variant="emphasized" icon={Plus} disabled={pending}>
            {pending ? "Menyimpan…" : "Buat Akun"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
