import Link from "next/link";
import { getAccounts, getJournalEntries } from "@/lib/queries";
import { formatRupiah } from "@/lib/format";
import { JournalForm } from "./journal-form";

export const dynamic = "force-dynamic";

export default async function JournalsPage() {
  const [accounts, entries] = await Promise.all([getAccounts(), getJournalEntries()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Catat Transaksi Harian</h1>
        <p className="mt-1 text-sm text-slate-500">
          Input jurnal umum (double-entry). Total debit harus sama dengan total kredit.
        </p>
      </div>

      <JournalForm accounts={accounts} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Riwayat Jurnal</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">No. Bukti</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3 text-center">Baris</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                  Belum ada jurnal. Buat yang pertama di atas.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{e.date}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/journals/${e.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {e.referenceNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{e.description ?? "—"}</td>
                <td className="px-4 py-3 text-center text-slate-500">{e.lineCount}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  {formatRupiah(e.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
