import { getAccounts, getJournalLines } from "@/lib/queries";
import { buildNeraca } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NeracaPage({
  searchParams,
}: {
  searchParams: Promise<{ as_of?: string }>;
}) {
  const { as_of } = await searchParams;
  const asOfDate = as_of ?? new Date().toISOString().slice(0, 10);

  const [accounts, lines] = await Promise.all([getAccounts(), getJournalLines()]);
  const r = buildNeraca(accounts, lines, asOfDate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Laporan Neraca Keuangan</h1>
        <p className="mt-1 text-sm text-slate-500">Posisi keuangan per {asOfDate}.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {[
          { label: "Total Aset", value: r.totalAsset, color: "text-emerald-600" },
          { label: "Total Kewajiban", value: r.totalLiability, color: "text-rose-600" },
          { label: "Total Modal + Laba", value: r.totalEquity, color: "text-indigo-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.color}`}>{formatRupiah(s.value)}</p>
          </div>
        ))}
      </div>

      <div
        className={`flex items-center gap-3 rounded-xl border px-5 py-4 text-sm ${
          r.balanced
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-rose-200 bg-rose-50 text-rose-800"
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${r.balanced ? "bg-emerald-500" : "bg-rose-500"}`} />
        <span className="font-semibold">
          {r.balanced
            ? "Sempurna! Neraca dalam keadaan seimbang (Aset = Kewajiban + Modal)."
            : "Perhatian! Neraca belum seimbang. Periksa kembali entri jurnal."}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ReportCard title="DETAIL ASET" accent="bg-emerald-500">
          {r.assetAccounts.map((a) => (
            <Row key={a.id} code={a.code} name={a.name} value={a.balance} />
          ))}
          <TotalRow label="Total Aset" value={r.totalAsset} />
        </ReportCard>

        <ReportCard title="DETAIL KEWAJIBAN & MODAL" accent="bg-indigo-500">
          <SubHeading label="KEWAJIBAN (LIABILITAS)" />
          {r.liabilityAccounts.map((a) => (
            <Row key={a.id} code={a.code} name={a.name} value={a.balance} />
          ))}
          <Row label="Total Kewajiban" value={r.totalLiability} bold />

          <SubHeading label="MODAL (EKUITAS)" />
          {r.equityAccounts.map((a) => (
            <Row key={a.id} code={a.code} name={a.name} value={a.balance} />
          ))}
          <Row label="Laba Berjalan (Tahun Ini)" value={r.currentYearIncome} />
          <TotalRow label="Total Modal" value={r.totalEquity} />
          <TotalRow label="Total Kewajiban + Modal" value={r.totalLiabilityEquity} />
        </ReportCard>
      </div>
    </div>
  );
}

function ReportCard({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <span className={`h-3 w-3 rounded-full ${accent}`} />
        <h2 className="text-sm font-bold tracking-wide text-slate-700">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Row({
  code,
  name,
  label,
  value,
  bold,
}: {
  code?: string;
  name?: string;
  label?: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-2 text-sm">
      <span className={bold ? "font-semibold text-slate-700" : "text-slate-600"}>
        {code && (
          <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-400">
            {code}
          </span>
        )}
        {name ?? label}
      </span>
      <span className={`${bold ? "font-semibold" : ""} ${value < 0 ? "text-rose-600" : "text-slate-800"}`}>
        {formatRupiah(value)}
      </span>
    </div>
  );
}

function SubHeading({ label }: { label: string }) {
  return (
    <p className="mt-4 mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="mt-2 flex items-center justify-between border-t-2 border-slate-200 py-2 text-sm font-bold">
      <span className="text-slate-900">{label}</span>
      <span className="text-slate-900">{formatRupiah(value)}</span>
    </div>
  );
}
