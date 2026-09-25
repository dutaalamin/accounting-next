"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2, AlertCircle, CheckCircle2, Save, FileText, Scale } from "lucide-react";
import type { InvoiceState } from "./actions";
import type { ProductListRow } from "@/lib/queries";
import { formatRupiah } from "@/lib/format";
import { Card, CardHeader, Button, InfoLabel, inputCls, labelCls } from "@/components/ui";

interface Party {
  id: number;
  name: string;
}

interface LineDraft {
  key: number;
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

let nextKey = 1;
function blankLine(): LineDraft {
  return { key: nextKey++, productId: "", description: "", quantity: "1", unitPrice: "" };
}

export function InvoiceForm({
  kind,
  parties,
  products,
  action,
}: {
  kind: "customer" | "supplier";
  parties: Party[];
  products: ProductListRow[];
  action: (prev: InvoiceState, formData: FormData) => Promise<InvoiceState>;
}) {
  const [state, formAction, pending] = useActionState<InvoiceState, FormData>(action, {});
  const [partyId, setPartyId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("0");
  const [status, setStatus] = useState("unpaid");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([blankLine()]);

  const isCustomer = kind === "customer";

  function updateLine(key: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  /** Saat produk dipilih, isi harga otomatis. */
  function onPickProduct(key: number, productId: string) {
    const p = products.find((x) => String(x.id) === productId);
    updateLine(key, {
      productId,
      unitPrice: p ? String(p.price) : "",
      description: p ? p.name : "",
    });
  }

  const subtotal = lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
    0,
  );
  const taxAmount = (subtotal * (Number(taxPercentage) || 0)) / 100;
  const total = subtotal + taxAmount;

  function payloadJson() {
    return JSON.stringify({
      partyId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      taxPercentage,
      status,
      notes,
      lines: lines.map((l) => ({
        productId: l.productId || null,
        description: l.description,
        quantity: Number(l.quantity) || 0,
        unitPrice: Number(l.unitPrice) || 0,
      })),
    });
  }

  const ready = partyId && invoiceNumber.trim() && total > 0;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="payload" value={payloadJson()} />

      {state.error && (
        <div className="flex items-start gap-2 rounded-xl border border-sap-negative/30 bg-sap-negative-bg px-4 py-3 text-[13px] text-sap-negative">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="flex items-center gap-2 rounded-xl border border-sap-positive/30 bg-sap-positive-bg px-4 py-3 text-[13px] text-sap-positive">
          <CheckCircle2 size={16} />
          {state.success}
        </div>
      )}

      <Card padded={false}>
        <CardHeader
          title="Informasi Invoice"
          description={`Data ${isCustomer ? "tagihan pelanggan" : "tagihan pemasok"}`}
          icon={FileText}
        />
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
          <div>
            <label className={labelCls}>{isCustomer ? "Pelanggan" : "Pemasok"}</label>
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className={inputCls}
            >
              <option value="">Pilih</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {parties.length === 0 && (
              <p className="mt-1 text-xs text-sap-critical">
                Belum ada data. Tambahkan dulu di menu {isCustomer ? "Pelanggan" : "Pemasok"}.
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Nomor Invoice</label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder={isCustomer ? "INV-001" : "SUP-001"}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Tanggal Invoice</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Jatuh Tempo (opsional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="unpaid">Belum Lunas (Unpaid)</option>
              <option value="paid">Lunas (Paid)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Pajak PPN (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={taxPercentage}
              onChange={(e) => setTaxPercentage(e.target.value)}
              className={`${inputCls} text-right tabular-nums`}
            />
          </div>
          <div className="md:col-span-3">
            <label className={labelCls}>Catatan (opsional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Keterangan tambahan"
              className={inputCls}
            />
          </div>
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader
          title="Rincian Barang / Jasa"
          description="Pilih produk atau isi manual"
          icon={Scale}
        />
        <div className="p-5">
          <div className="hidden grid-cols-12 gap-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-sap-label md:grid">
            <div className="col-span-4">Produk</div>
            <div className="col-span-3">Keterangan</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-2 text-right">Harga</div>
            <div className="col-span-2 text-right">Subtotal</div>
          </div>

          <div className="space-y-2">
            {lines.map((l, idx) => {
              const sub = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
              return (
                <div key={l.key} className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-12 md:col-span-4">
                    <select
                      value={l.productId}
                      onChange={(e) => onPickProduct(l.key, e.target.value)}
                      className={inputCls}
                      aria-label={`Produk baris ${idx + 1}`}
                    >
                      <option value="">Manual</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku ? `${p.sku} ` : ""}
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <input
                      value={l.description}
                      onChange={(e) => updateLine(l.key, { description: e.target.value })}
                      placeholder="Keterangan"
                      className={inputCls}
                      aria-label={`Keterangan baris ${idx + 1}`}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <input
                      type="number"
                      min="1"
                      value={l.quantity}
                      onChange={(e) => updateLine(l.key, { quantity: e.target.value })}
                      className={`${inputCls} text-right tabular-nums`}
                      aria-label={`Qty baris ${idx + 1}`}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={l.unitPrice}
                      onChange={(e) => updateLine(l.key, { unitPrice: e.target.value })}
                      placeholder="0"
                      className={`${inputCls} text-right tabular-nums`}
                      aria-label={`Harga baris ${idx + 1}`}
                    />
                  </div>
                  <div className="col-span-3 flex items-center justify-end md:col-span-2">
                    <span className="mr-1 text-sm font-medium tabular-nums text-sap-text">
                      {formatRupiah(sub)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLines((p) => p.filter((x) => x.key !== l.key))}
                      disabled={lines.length <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-sap-label transition hover:bg-sap-negative-bg hover:text-sap-negative disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Hapus baris"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <Button variant="ghost" icon={Plus} onClick={() => setLines((p) => [...p, blankLine()])}>
              Tambah Baris
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-sap-border-light bg-sap-header px-5 py-4">
          <div className="flex gap-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sap-label">
                Subtotal
              </p>
              <p className="text-sm font-semibold tabular-nums">{formatRupiah(subtotal)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sap-label">
                PPN
              </p>
              <p className="text-sm font-semibold tabular-nums">{formatRupiah(taxAmount)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sap-label">
                Total
              </p>
              <p className="text-base font-bold tabular-nums text-sap-text">{formatRupiah(total)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!ready && (
              <InfoLabel tone="critical">
                {parties.length === 0
                  ? "Belum ada data master"
                  : "Lengkapi data & total > 0"}
              </InfoLabel>
            )}
            <Button
              type="submit"
              variant="emphasized"
              icon={Save}
              disabled={pending || !ready}
            >
              {pending ? "Menyimpan…" : "Simpan & Posting Jurnal"}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
