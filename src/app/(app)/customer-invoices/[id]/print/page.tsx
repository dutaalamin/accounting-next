import { notFound } from "next/navigation";
import { getCustomerInvoice } from "@/lib/queries";
import { formatRupiah } from "@/lib/format";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

export default async function PrintCustomerInvoice({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await getCustomerInvoice(Number(id));
  if (!inv) notFound();

  const subtotal = inv.lines.reduce((s, l) => s + l.subtotal, 0);

  return (
    <div className="mx-auto max-w-[800px] bg-white p-10 print:p-0">
      <PrintButton />

      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">INVOICE</h1>
          <p className="mt-1 text-sm text-slate-600">{inv.invoiceNumber}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-slate-900">Accounting</p>
          <p className="text-slate-600">Tanggal: {inv.invoiceDate}</p>
          {inv.dueDate && <p className="text-slate-600">Jatuh tempo: {inv.dueDate}</p>}
          <p className="mt-1 font-semibold text-slate-900">
            {inv.status === "paid" ? "LUNAS" : "BELUM LUNAS"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Ditagihkan kepada
        </p>
        <p className="mt-1 text-base font-semibold text-slate-900">{inv.partyName}</p>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2">Produk / Keterangan</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Harga</th>
            <th className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines.map((l) => (
            <tr key={l.id} className="border-b border-slate-100">
              <td className="py-2 text-slate-800">{l.productName ?? l.description ?? "—"}</td>
              <td className="py-2 text-right tabular-nums">{l.quantity}</td>
              <td className="py-2 text-right tabular-nums">{formatRupiah(l.unitPrice)}</td>
              <td className="py-2 text-right tabular-nums">{formatRupiah(l.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="py-2 text-right text-slate-600">
              Subtotal
            </td>
            <td className="py-2 text-right tabular-nums">{formatRupiah(subtotal)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="py-2 text-right text-slate-600">
              PPN ({inv.taxPercentage}%)
            </td>
            <td className="py-2 text-right tabular-nums">{formatRupiah(inv.taxAmount)}</td>
          </tr>
          <tr className="border-t-2 border-slate-800">
            <td colSpan={3} className="py-2 text-right font-bold text-slate-900">
              Total
            </td>
            <td className="py-2 text-right font-bold tabular-nums text-slate-900">
              {formatRupiah(inv.totalAmount)}
            </td>
          </tr>
        </tfoot>
      </table>

      {inv.notes && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Catatan</p>
          <p className="mt-1 text-sm text-slate-700">{inv.notes}</p>
        </div>
      )}
    </div>
  );
}
