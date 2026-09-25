import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getAccounts, getJournalLines } from "@/lib/queries";
import { buildLabaRugi, sumForAccount } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import { PageHeader, Card, CardHeader, Tile, Table, Th, Td, Code } from "@/components/ui";
import { RangeWarning } from "@/components/range-warning";
import { normalizeRange } from "@/lib/accounting/dates";

export const dynamic = "force-dynamic";

export default async function LabaRugiPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const range = normalizeRange(sp.start, sp.end);
  const { start: startDate, end: endDate, swapped } = range;

  const [accounts, lines] = await Promise.all([getAccounts(), getJournalLines()]);
  const r = buildLabaRugi(accounts, lines, startDate, endDate);

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
        subtitle={`Periode ${startDate} sampai ${endDate}`}
        breadcrumb={["Home", "Laporan", "Laba Rugi"]}
      />

      {swapped && <RangeWarning start={sp.start ?? ""} end={sp.end ?? ""} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile
          label="Total Pendapatan"
          value={formatRupiah(r.totalRevenue)}
          icon={TrendingUp}
          tone="positive"
        />
        <Tile
          label="Total Beban"
          value={formatRupiah(r.totalExpense)}
          icon={TrendingDown}
          tone="negative"
        />
        <Tile
          label="Laba Bersih"
          value={formatRupiah(r.netIncome)}
          icon={r.netIncome >= 0 ? TrendingUp : Minus}
          tone={r.netIncome >= 0 ? "blue" : "critical"}
        />
      </div>

      <Card padded={false}>
        <CardHeader title="Perbandingan Pendapatan & Beban" description="Skala relatif periode ini" />
        <div className="space-y-4 p-4">
          <Meter label="Pendapatan" value={r.totalRevenue} pct={(r.totalRevenue / max) * 100} tone="bg-sap-positive" />
          <Meter label="Beban" value={r.totalExpense} pct={(r.totalExpense / max) * 100} tone="bg-sap-negative" />
          <div className="flex items-center justify-between rounded border border-sap-border-light bg-sap-header px-3 py-2.5">
            <span className="text-sm font-semibold">Laba Bersih</span>
            <span
              className={`text-base font-bold tabular-nums ${
                r.netIncome >= 0 ? "text-sap-positive" : "text-sap-negative"
              }`}
            >
              {formatRupiah(r.netIncome)}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DetailCard
          title="Rincian Pendapatan"
          rows={revenueDetail}
          total={r.totalRevenue}
          emptyText="Belum ada pendapatan pada periode ini."
        />
        <DetailCard
          title="Rincian Beban"
          rows={expenseDetail}
          total={r.totalExpense}
          emptyText="Belum ada beban pada periode ini."
        />
      </div>
    </>
  );
}

function Meter({ label, value, pct, tone }: { label: string; value: number; pct: number; tone: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-sap-label">{label}</span>
        <span className="font-semibold tabular-nums">{formatRupiah(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-sap-border-light">
        <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}

function DetailCard({
  title,
  rows,
  total,
  emptyText,
}: {
  title: string;
  rows: { code: string; name: string; amount: number }[];
  total: number;
  emptyText: string;
}) {
  return (
    <Card padded={false}>
      <CardHeader title={title} description={`${rows.length} akun`} />
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
              <Td colSpan={3} className="py-8 text-center text-sap-label">
                {emptyText}
              </Td>
            </tr>
          )}
          {rows.map((x) => (
            <tr key={x.code} className="hover:bg-sap-hover">
              <Td>
                <Code>{x.code}</Code>
              </Td>
              <Td>{x.name}</Td>
              <Td align="right" className="font-semibold tabular-nums">
                {formatRupiah(x.amount)}
              </Td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-sap-header">
            <Td colSpan={2} className="font-semibold">
              Total
            </Td>
            <Td align="right" className="font-bold tabular-nums">
              {formatRupiah(total)}
            </Td>
          </tr>
        </tfoot>
      </Table>
    </Card>
  );
}
