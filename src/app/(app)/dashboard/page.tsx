import { getJournalLines, getAccounts } from "@/lib/queries";
import { buildNeraca, buildLabaRugi } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [accounts, lines] = await Promise.all([getAccounts(), getJournalLines()]);

  const today = new Date().toISOString().slice(0, 10);
  const yearStart = `${today.slice(0, 4)}-01-01`;

  const neraca = buildNeraca(accounts, lines, today);
  const labaRugi = buildLabaRugi(accounts, lines, yearStart, today);

  const stats = [
    { label: "Total Aset", value: neraca.totalAsset, color: "text-emerald-600" },
    { label: "Total Kewajiban", value: neraca.totalLiability, color: "text-rose-600" },
    { label: "Total Modal", value: neraca.totalEquity, color: "text-indigo-600" },
    { label: "Laba Tahun Berjalan", value: labaRugi.netIncome, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Ringkasan posisi keuangan per {today}.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.color}`}>{formatRupiah(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              neraca.balanced ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          <p className="text-sm font-semibold text-slate-700">
            {neraca.balanced
              ? "Neraca seimbang (Aset = Kewajiban + Modal)."
              : "Neraca belum seimbang — periksa kembali entri jurnal."}
          </p>
        </div>
      </div>
    </div>
  );
}
