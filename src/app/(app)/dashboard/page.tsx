import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  PenLine,
} from "lucide-react";
import { getJournalLines, getAccounts, getJournalEntries } from "@/lib/queries";
import { buildNeraca, buildLabaRugi, buildArusKas } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import { PageHeader, Card, CardHeader, StatCard, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [accounts, lines, journals] = await Promise.all([
    getAccounts(),
    getJournalLines(),
    getJournalEntries(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const yearStart = `${today.slice(0, 4)}-01-01`;

  const neraca = buildNeraca(accounts, lines, today);
  const labaRugi = buildLabaRugi(accounts, lines, yearStart, today);
  const arusKas = buildArusKas(accounts, lines, yearStart, today);

  const recent = [...journals].reverse().slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Ringkasan posisi keuangan per ${today}`}
        action={
          <Link
            href="/journals"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <PenLine size={16} />
            Catat Transaksi
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Aset"
          value={formatRupiah(neraca.totalAsset)}
          icon={Wallet}
          tone="indigo"
        />
        <StatCard
          label="Laba Tahun Ini"
          value={formatRupiah(labaRugi.netIncome)}
          icon={labaRugi.netIncome >= 0 ? TrendingUp : TrendingDown}
          tone={labaRugi.netIncome >= 0 ? "emerald" : "rose"}
        />
        <StatCard
          label="Kas & Bank"
          value={formatRupiah(arusKas.closingCash)}
          icon={PiggyBank}
          tone="amber"
        />
        <StatCard
          label="Total Kewajiban"
          value={formatRupiah(neraca.totalLiability)}
          icon={TrendingDown}
          tone="slate"
        />
      </div>

      {/* Status neraca */}
      <Card
        className={`flex items-center gap-3 ${
          neraca.balanced ? "!border-emerald-200 !bg-emerald-50/60" : "!border-amber-200 !bg-amber-50/60"
        }`}
      >
        {neraca.balanced ? (
          <CheckCircle2 size={20} className="text-emerald-600" />
        ) : (
          <AlertTriangle size={20} className="text-amber-600" />
        )}
        <div>
          <p
            className={`text-sm font-semibold ${
              neraca.balanced ? "text-emerald-800" : "text-amber-800"
            }`}
          >
            {neraca.balanced
              ? "Neraca seimbang — Aset = Kewajiban + Modal"
              : "Neraca belum seimbang, periksa kembali entri jurnal"}
          </p>
          <p className="text-xs text-slate-500">
            Aset {formatRupiah(neraca.totalAsset)} · Kewajiban + Modal{" "}
            {formatRupiah(neraca.totalLiabilityEquity)}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Ringkasan pendapatan/beban */}
        <Card className="lg:col-span-2" padded={false}>
          <CardHeader title="Kinerja Tahun Ini" description={`${yearStart} — ${today}`} />
          <div className="space-y-4 p-5">
            <Bar label="Pendapatan" value={labaRugi.totalRevenue} max={Math.max(labaRugi.totalRevenue, labaRugi.totalExpense, 1)} tone="bg-emerald-500" />
            <Bar label="Beban" value={labaRugi.totalExpense} max={Math.max(labaRugi.totalRevenue, labaRugi.totalExpense, 1)} tone="bg-rose-500" />
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm font-medium text-slate-600">Laba Bersih</span>
              <span className="text-base font-semibold text-slate-900">
                {formatRupiah(labaRugi.netIncome)}
              </span>
            </div>
          </div>
        </Card>

        {/* Jurnal terbaru */}
        <Card className="lg:col-span-3" padded={false}>
          <CardHeader
            title="Transaksi Terbaru"
            description="5 jurnal terakhir"
            action={
              <Link
                href="/journals"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Lihat semua <ArrowUpRight size={13} />
              </Link>
            }
          />
          <div className="divide-y divide-slate-50">
            {recent.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-slate-400">
                Belum ada transaksi.
              </p>
            )}
            {recent.map((j) => (
              <Link
                key={j.id}
                href={`/journals/${j.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-slate-50/70"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{j.referenceNumber}</span>
                    <Badge tone={j.isPosted ? "emerald" : "amber"}>
                      {j.isPosted ? "Posted" : "Draft"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {j.date} · {j.description ?? "Tanpa keterangan"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-slate-900">
                  {formatRupiah(j.total)}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function Bar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
}) {
  const pct = Math.min(100, Math.round((Math.abs(value) / max) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500">{label}</span>
        <span className="font-semibold text-slate-700">{formatRupiah(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
