import { getAccounts, getJournalLines } from "@/lib/queries";
import { buildLabaRugi } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LabaRugiPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const startDate = sp.start ?? `${now.getFullYear()}-01-01`;
  const endDate = sp.end ?? now.toISOString().slice(0, 10);

  const [accounts, lines] = await Promise.all([getAccounts(), getJournalLines()]);
  const r = buildLabaRugi(accounts, lines, startDate, endDate);

  const stats = [
    { label: "Total Pendapatan", value: r.totalRevenue, color: "text-emerald-600" },
    { label: "Total Pengeluaran", value: r.totalExpense, color: "text-rose-600" },
    { label: "Laba Bersih", value: r.netIncome, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Laporan Laba Rugi Bersih</h1>
        <p className="mt-1 text-sm text-slate-500">
          Periode {startDate} s/d {endDate}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.color}`}>{formatRupiah(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Laba bersih dihitung dari total pendapatan dikurangi total beban pada periode ini.
          Rumus ini sama dengan yang dipakai di project Laravel.
        </p>
      </div>
    </div>
  );
}
