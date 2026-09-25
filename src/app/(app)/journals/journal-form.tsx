"use client";

import { useActionState, useState } from "react";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Scale,
  Save,
} from "lucide-react";
import { createJournal, type JournalState } from "./actions";
import { formatRupiah } from "@/lib/format";
import type { AccountRow } from "@/lib/accounting/reports";
import { Card, CardHeader, Button, InfoLabel, inputCls, labelCls } from "@/components/ui";

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
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="payload" value={payloadJson()} />

      {state.error && (
        <div className="flex items-center gap-2 rounded border border-sap-negative/30 bg-sap-negative-bg px-3 py-2 text-[13px] text-sap-negative">
          <AlertCircle size={15} />
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="flex items-center gap-2 rounded border border-sap-positive/30 bg-sap-positive-bg px-3 py-2 text-[13px] text-sap-positive">
          <CheckCircle2 size={15} />
          {state.success}
        </div>
      )}

      {/* Informasi jurnal */}
      <Card padded={false}>
        <CardHeader
          title="Informasi Jurnal"
          description="Nomor bukti, tanggal, dan keterangan umum"
          icon={FileText}
        />
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
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
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
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
      </Card>

      {/* Rincian */}
      <Card padded={false}>
        <CardHeader
          title="Rincian Debit / Kredit"
          description="Total debit harus sama dengan total kredit"
          icon={Scale}
          action={
            <InfoLabel tone={balanced ? "positive" : "critical"}>
              {balanced
                ? "Balance"
                : totalDebit === 0 && totalCredit === 0
                  ? "Belum diisi"
                  : `Selisih ${formatRupiah(Math.abs(diff))}`}
            </InfoLabel>
          }
        />

        <div className="p-4">
          <div className="hidden grid-cols-12 gap-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-sap-label md:grid">
            <div className="col-span-4">Akun</div>
            <div className="col-span-3 text-right">Debit</div>
            <div className="col-span-3 text-right">Kredit</div>
            <div className="col-span-2" />
          </div>

          <div className="space-y-2">
            {lines.map((l, idx) => (
              <div key={l.key} className="grid grid-cols-12 items-center gap-2">
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
                    className="flex h-8 w-8 items-center justify-center rounded text-sap-label transition hover:bg-sap-negative-bg hover:text-sap-negative disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Hapus baris"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <Button
              variant="ghost"
              icon={Plus}
              onClick={() => setLines((p) => [...p, blankLine()])}
            >
              Tambah Baris
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-sap-border-light bg-sap-header px-4 py-3">
          <div className="flex gap-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sap-label">
                Total Debit
              </p>
              <p className="text-base font-semibold tabular-nums text-sap-text">
                {formatRupiah(totalDebit)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sap-label">
                Total Kredit
              </p>
              <p className="text-base font-semibold tabular-nums text-sap-text">
                {formatRupiah(totalCredit)}
              </p>
            </div>
          </div>

          <Button type="submit" variant="emphasized" icon={Save} disabled={pending || !balanced}>
            {pending ? "Menyimpan…" : "Simpan Jurnal"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
