import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  Plus,
  BarChart3,
} from "lucide-react";
import { getJournalLines, getAccounts, getJournalEntries } from "@/lib/queries";
import { buildNeraca, buildLabaRugi, buildArusKas } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import {
  PageHeader,
  Card,
  CardHeader,
  Tile,
  Table,
  Th,
  Td,
  Button,
  EmptyState,
} from "@/components/ui";

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

  const recent = [...journals].reverse().slice(0, 6);

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`Posisi keuangan per ${today}`}
        breadcrumb={["Home", "Overview"]}
        action={
          <Link href="/journals">
            <Button variant="emphasized" icon={Plus}>
              Catat Transaksi
            </Button>
          </Link>
        }
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Total Aset" value={formatRupiah(neraca.totalAsset)} icon={Wallet} tone="blue" />
        <Tile
          label="Laba Tahun Ini"
          value={formatRupiah(labaRugi.netIncome)}
          icon={labaRugi.netIncome >= 0 ? TrendingUp : TrendingDown}
          tone={labaRugi.netIncome >= 0 ? "positive" : "negative"}
        />
        <Tile
          label="Kas & Bank"
          value={formatRupiah(arusKas.closingCash)}
          icon={PiggyBank}
          tone="critical"
        />
        <Tile
          label="Kewajiban"
          value={formatRupiah(neraca.totalLiability)}
          icon={TrendingDown}
          tone="neutral"
        />
      </div>

      {/* Status neraca */}
      <Card className="flex items-center gap-3">
        {neraca.balanced ? (
          <CheckCircle2 size={18} className="text-sap-positive" />
        ) : (
          <AlertTriangle size={18} className="text-sap-critical" />
        )}
        <span className="text-sm font-medium text-sap-text">
          {neraca.balanced
            ? "Neraca seimbang — Aset = Kewajiban + Modal"
            : "Neraca belum seimbang, periksa kembali entri jurnal"}
        </span>
        <span className="ml-auto text-xs text-sap-label">
          Aset {formatRupiah(neraca.totalAsset)}, Kewajiban + Modal{" "}
          {formatRupiah(neraca.totalLiabilityEquity)}
        </span>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Kinerja */}
        <Card className="lg:col-span-2" padded={false}>
          <CardHeader
            title="Kinerja Tahun Ini"
            description={`${yearStart} sampai ${today}`}
            icon={BarChart3}
          />
          <div className="space-y-4 p-4">
            <Meter
              label="Pendapatan"
              value={labaRugi.totalRevenue}
              max={Math.max(labaRugi.totalRevenue, labaRugi.totalExpense, 1)}
              tone="bg-sap-positive"
            />
            <Meter
              label="Beban"
              value={labaRugi.totalExpense}
              max={Math.max(labaRugi.totalRevenue, labaRugi.totalExpense, 1)}
              tone="bg-sap-negative"
            />
            <div className="flex items-center justify-between border-t border-sap-border-light pt-3">
              <span className="text-sm text-sap-label">Laba Bersih</span>
              <span className="text-base font-semibold tabular-nums text-sap-text">
                {formatRupiah(labaRugi.netIncome)}
              </span>
            </div>
          </div>
        </Card>

        {/* Transaksi terbaru */}
        <Card className="lg:col-span-3" padded={false}>
          <CardHeader
            title="Transaksi Terbaru"
            description="6 jurnal terakhir"
            action={
              <Link
                href="/journals"
                className="text-xs font-medium text-sap-blue hover:text-sap-blue-dark hover:underline"
              >
                Semua
              </Link>
            }
          />
          <Table>
            <thead>
              <tr>
                <Th className="w-28">Tanggal</Th>
                <Th className="w-32">No. Bukti</Th>
                <Th>Keterangan</Th>
                <Th align="right" className="w-36">
                  Total
                </Th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <EmptyState
                  title="Belum ada transaksi"
                  description="Catat transaksi pertama lewat menu Transaksi."
                  colSpan={4}
                />
              )}
              {recent.map((j) => (
                <tr key={j.id} className="hover:bg-sap-hover">
                  <Td className="text-sap-label">{j.date}</Td>
                  <Td>
                    <Link
                      href={`/journals/${j.id}`}
                      className="font-medium text-sap-blue hover:underline"
                    >
                      {j.referenceNumber}
                    </Link>
                  </Td>
                  <Td className="text-sap-label">{j.description ?? "—"}</Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    {formatRupiah(j.total)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </>
  );
}

function Meter({
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
        <span className="text-sap-label">{label}</span>
        <span className="font-semibold tabular-nums text-sap-text">{formatRupiah(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-sap-border-light">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

