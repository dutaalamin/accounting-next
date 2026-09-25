import Link from "next/link";
import { notFound } from "next/navigation";
import { getJournalEntry } from "@/lib/queries";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getJournalEntry(Number(id));
  if (!entry) notFound();

  const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/journals" className="text-sm text-blue-600 hover:underline">
            ← Kembali ke daftar jurnal
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{entry.referenceNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {entry.date} · {entry.description ?? "Tanpa keterangan"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            entry.isPosted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {entry.isPosted ? "Posted" : "Draft"}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Akun</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3 text-right">Debit</th>
              <th className="px-4 py-3 text-right">Kredit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entry.lines.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                    {l.accountCode}
                  </span>{" "}
                  <span className="font-medium text-slate-800">{l.accountName}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{l.description ?? "—"}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  {l.debit ? formatRupiah(l.debit) : "—"}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  {l.credit ? formatRupiah(l.credit) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold">
            <tr>
              <td colSpan={2} className="px-4 py-3 text-slate-700">
                Total
              </td>
              <td className="px-4 py-3 text-right text-slate-900">{formatRupiah(totalDebit)}</td>
              <td className="px-4 py-3 text-right text-slate-900">{formatRupiah(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
