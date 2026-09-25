import { Wallet, TrendingUp, TrendingDown, CalendarDays } from "lucide-react";
import { getAccounts, getJournalLines } from "@/lib/queries";
import { buildArusKas, type CashFlowDetail } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import { PageHeader, Card, CardHeader, Tile, Table, Th, Td, Code } from "@/components/ui";
import { RangeWarning } from "@/components/range-warning";
import { normalizeRange } from "@/lib/accounting/dates";

export const dynamic = "force-dynamic";

export default async function ArusKasPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const range = normalizeRange(sp.start, sp.end);
  const { start: startDate, end: endDate, swapped } = range;

  const [accounts, lines] = await Promise.all([getAccounts(), getJournalLines()]);
  const r = buildArusKas(accounts, lines, startDate, endDate);
  const surplus = r.netChange >= 0;

  return (
    <>
      <PageHeader
        title="Arus Kas"
        subtitle={`Metode tidak langsung · ${startDate} — ${endDate}`}
        breadcrumb={["Home", "Laporan", "Arus Kas"]}
      />

      {swapped && <RangeWarning start={sp.start ?? ""} end={sp.end ?? ""} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile
          label="Saldo Kas Awal"
          value={formatRupiah(r.openingCash)}
          icon={Wallet}
          tone="neutral"
          accentBar
        />
        <Tile
          label="Perubahan Kas Bersih"
          value={formatRupiah(r.netChange)}
          icon={surplus ? TrendingUp : TrendingDown}
          tone={surplus ? "positive" : "negative"}
          accentBar
        />
        <Tile
          label="Saldo Kas Akhir"
          value={formatRupiah(r.closingCash)}
          icon={Wallet}
          tone="blue"
          accentBar
        />
      </div>

      <Card className="flex items-center gap-3">
        {surplus ? (
          <TrendingUp size={18} className="text-sap-positive" />
        ) : (
          <TrendingDown size={18} className="text-sap-negative" />
        )}
        <span className="text-sm font-medium">
          Status kas periode ini: {surplus ? "Surplus" : "Defisit"} sebesar{" "}
          {formatRupiah(Math.abs(r.netChange))}
        </span>
      </Card>

      <ActivityTable
        title="Aktivitas Operasi"
        details={r.operatingDetails}
        total={r.operatingFlow}
        emptyText="Tidak ada aktivitas operasi pada periode ini."
      />
      <ActivityTable
        title="Aktivitas Investasi"
        details={r.investingDetails}
        total={r.investingFlow}
        emptyText="Tidak ada aktivitas investasi pada periode ini."
      />
      <ActivityTable
        title="Aktivitas Pendanaan"
        details={r.financingDetails}
        total={r.financingFlow}
        emptyText="Tidak ada aktivitas pendanaan pada periode ini."
      />

      <Card padded={false}>
        <CardHeader
          title="Rekonsiliasi Saldo Kas"
          description="Dari saldo awal menjadi saldo akhir"
          icon={CalendarDays}
        />
        <div className="p-4">
          <ReconRow label={`Saldo Kas Awal (per ${startDate})`} value={r.openingCash} />
          <ReconRow label="Total Kenaikan / Penurunan Kas Bersih" value={r.netChange} />
          <div className="mt-3 flex items-center justify-between rounded border border-sap-blue/30 bg-sap-blue-light px-3 py-2.5">
            <span className="text-sm font-semibold text-sap-blue-dark">
              Saldo Kas Akhir (per {endDate})
            </span>
            <span className="text-base font-bold tabular-nums text-sap-blue-dark">
              {formatRupiah(r.closingCash)}
            </span>
          </div>
        </div>
      </Card>
    </>
  );
}

function ActivityTable({
  title,
  details,
  total,
  emptyText,
}: {
  title: string;
  details: CashFlowDetail[];
  total: number;
  emptyText: string;
}) {
  return (
    <Card padded={false}>
      <CardHeader title={title} description={`${details.length} akun`} />
      <Table>
        <thead>
          <tr>
            <Th className="w-24">Kode</Th>
            <Th>Akun</Th>
            <Th align="right" className="w-48">
              Jumlah
            </Th>
          </tr>
        </thead>
        <tbody>
          {details.length === 0 && (
            <tr>
              <Td colSpan={3} className="py-8 text-center text-sap-label">
                {emptyText}
              </Td>
            </tr>
          )}
          {details.map((d) => (
            <tr key={d.code} className="hover:bg-sap-hover">
              <Td>
                <Code>{d.code}</Code>
              </Td>
              <Td>{d.name}</Td>
              <Td
                align="right"
                className={`font-semibold tabular-nums ${
                  d.amount >= 0 ? "text-sap-positive" : "text-sap-negative"
                }`}
              >
                {formatRupiah(d.amount)}
              </Td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-sap-header">
            <Td colSpan={2} className="font-semibold">
              Arus Kas Bersih
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

function ReconRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-sap-border-light py-2.5">
      <span className="text-sm text-sap-label">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{formatRupiah(value)}</span>
    </div>
  );
}
