import { getAccounts, getJournalLines } from "@/lib/queries";
import { buildArusKas, type CashFlowDetail } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ArusKasPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const startDate = sp.start ?? `${now.getFullYear()}-01-01`;
  const endDate = sp.end ?? now.toISOString().slice(0, 10);

  const [accounts, lines] = await Promise.all([getAccounts(), getJournalLines()]);
  const r = buildArusKas(accounts, lines, startDate, endDate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Laporan Arus Kas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Metode tidak langsung · {startDate} s/d {endDate}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card label="Saldo Kas Awal" value={r.openingCash} accent="bg-slate-400" />
        <Card label="Perubahan Kas Bersih" value={r.netChange} accent={r.netChange >= 0 ? "bg-emerald-500" : "bg-rose-500"} />
        <Card label="Saldo Kas Akhir" value={r.closingCash} accent="bg-indigo-500" />
      </div>

      <div
        className={`rounded-xl border px-5 py-4 text-sm font-semibold ${
          r.netChange >= 0
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-rose-200 bg-rose-50 text-rose-800"
        }`}
      >
        Status Kas Periode Ini: {r.netChange >= 0 ? "Surplus" : "Defisit"} sebesar{" "}
        {formatRupiah(Math.abs(r.netChange))}
      </div>

      <ActivityTable title="AKTIVITAS OPERASI" accent="bg-emerald-500" details={r.operatingDetails} total={r.operatingFlow} emptyText="Tidak ada aktivitas operasi pada periode ini." />
      <ActivityTable title="AKTIVITAS INVESTASI" accent="bg-amber-500" details={r.investingDetails} total={r.investingFlow} emptyText="Tidak ada aktivitas investasi pada periode ini." />
      <ActivityTable title="AKTIVITAS PENDANAAN" accent="bg-indigo-500" details={r.financingDetails} total={r.financingFlow} emptyText="Tidak ada aktivitas pendanaan pada periode ini." />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold tracking-wide text-slate-700">REKONSILIASI SALDO KAS</h2>
        </div>
        <div className="px-5 py-4 text-sm">
          <ReconRow label={`Saldo Kas Awal (per ${startDate})`} value={r.openingCash} />
          <ReconRow label="Total Kenaikan / Penurunan Kas Bersih" value={r.netChange} />
          <div className="mt-2 flex items-center justify-between border-t-2 border-indigo-200 py-2 font-bold">
            <span className="text-indigo-700">Saldo Kas Akhir (per {endDate})</span>
            <span className="text-indigo-700">{formatRupiah(r.closingCash)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`absolute left-0 top-0 h-full w-2 ${accent}`} />
      <div className="pl-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{formatRupiah(value)}</p>
      </div>
    </div>
  );
}

function ActivityTable({
  title,
  accent,
  details,
  total,
  emptyText,
}: {
  title: string;
  accent: string;
  details: CashFlowDetail[];
  total: number;
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <span className={`h-3 w-3 rounded-full ${accent}`} />
        <h2 className="text-sm font-bold tracking-wide text-slate-700">{title}</h2>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b border-slate-100 bg-slate-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-5 py-3">Akun</th>
            <th className="px-5 py-3 text-right">Jumlah</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {details.length === 0 && (
            <tr>
              <td colSpan={2} className="px-5 py-6 text-center text-slate-400 italic">
                {emptyText}
              </td>
            </tr>
          )}
          {details.map((d) => (
            <tr key={d.code}>
              <td className="px-5 py-3 text-slate-700">
                <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-400">
                  {d.code}
                </span>
                {d.name}
              </td>
              <td
                className={`px-5 py-3 text-right font-semibold ${
                  d.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatRupiah(d.amount)}
              </td>
            </tr>
          ))}
          <tr className="border-t border-slate-200 bg-slate-50/60 font-bold">
            <td className="px-5 py-3 text-slate-900">Arus Kas Bersih</td>
            <td className="px-5 py-3 text-right text-slate-900">{formatRupiah(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ReconRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-2">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-800">{formatRupiah(value)}</span>
    </div>
  );
}
