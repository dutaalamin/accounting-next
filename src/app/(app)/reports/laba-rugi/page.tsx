import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { getAccounts, getJournalLines } from "@/lib/queries";
import { buildLabaRugi, sumForAccount } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import { PageHeader, Card, CardHeader, StatCard, Table, Th, Td } from "@/components/ui";

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

  // Rincian per akun (mutasi dalam rentang).
  const detail = (type: "revenue" | "expense") =>
    accounts
      .filter((a) => a.type === type)
      .map((a) => {
        const { debit, credit } = sumForAccount(lines, a.id, startDate, endDate);
        const amount = type === "revenue" ? credit - debit : debit - credit;
        return { code: a.code, name: a.name, amount };
      })
      .filter((x) => Math.abs(x.amount) > 0);

  const revenueDetail = detail("revenue");
  const expenseDetail = detail("expense");
  const max = Math.max(r.totalRevenue, r.totalExpense, 1);

  return (
    <>
      <PageHeader
        title="Laba Rugi"
        subtitle={`Periode ${startDate} — ${endDate}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Pendapatan"
          value={formatRupiah(r.totalRevenue)}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label="Total Beban"
          value={formatRupiah(r.totalExpense)}
          icon={TrendingDown}
          tone="rose"
        />
        <StatCard
          label="Laba Bersih"
          value={formatRupiah(r.netIncome)}
          icon={r.netIncome >= 0 ? TrendingUp : Minus}
          tone={r.netIncome >= 0 ? "indigo" : "amber"}
        />
      </div>

      {/* Perbandingan visual */}
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-indigo-500">
            <BarChart3 size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Perbandingan Pendapatan & Beban</h2>
            <p className="text-xs text-slate-500">Skala relatif pada periode ini</p>
          </div>
        </div>
        <div className="space-y-4">
          <Bar label="Pendapatan" value={r.totalRevenue} pct={(r.totalRevenue / max) * 100} tone="bg-emerald-500" />
          <Bar label="Beban" value={r.totalExpense} pct={(r.totalExpense / max) * 100} tone="bg-rose-500" />
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm font-semibold text-slate-700">Laba Bersih</span>
          <span
            className={`text-base font-bold tabular-nums ${
              r.netIncome >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {formatRupiah(r.netIncome)}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DetailCard
          title="Rincian Pendapatan"
          accent="text-emerald-600"
          rows={revenueDetail}
          total={r.totalRevenue}
          emptyText="Belum ada pendapatan pada periode ini."
        />
        <DetailCard
          title="Rincian Beban"
          accent="text-rose-600"
          rows={expenseDetail}
          total={r.totalExpense}
          emptyText="Belum ada beban pada periode ini."
        />
      </div>
    </>
  );
}

function Bar({ label, value, pct, tone }: { label: string; value: number; pct: number; tone: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500">{label}</span>
        <span className="font-semibold tabular-nums text-slate-700">{formatRupiah(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${tone}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

function DetailCard({
  title,
  accent,
  rows,
  total,
  emptyText,
}: {
  title: string;
  accent: string;
  rows: { code: string; name: string; amount: number }[];
  total: number;
  emptyText: string;
}) {
  return (
    <Card padded={false}>
      <CardHeader title={title} description={`${rows.length} akun`} accent={accent} />
      <Table>
        <thead>
          <tr>
            <Th className="w-24">Kode</Th>
            <Th>Akun</Th>
            <Th align="right" className="w-44">
              Jumlah
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <Td colSpan={3} className="py-8 text-center text-slate-400 italic">
                {emptyText}
              </Td>
            </tr>
          )}
          {rows.map((x) => (
            <tr key={x.code} className="transition hover:bg-slate-50/70">
              <Td>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                  {x.code}
                </span>
              </Td>
              <Td className="text-slate-700">{x.name}</Td>
              <Td align="right" className="font-semibold tabular-nums text-slate-900">
                {formatRupiah(x.amount)}
              </Td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50/80">
            <Td colSpan={2} className="font-bold text-slate-900">
              Total
            </Td>
            <Td align="right" className="font-bold tabular-nums text-slate-900">
              {formatRupiah(total)}
            </Td>
          </tr>
        </tfoot>
      </Table>
    </Card>
  );
}
