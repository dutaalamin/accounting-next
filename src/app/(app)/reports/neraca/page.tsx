import { Wallet, TrendingDown, PiggyBank, CheckCircle2, AlertTriangle } from "lucide-react";
import { getAccounts, getJournalLines } from "@/lib/queries";
import { buildNeraca } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import { PageHeader, Card, CardHeader, Tile, Table, Th, Td, Code } from "@/components/ui";

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
    <>
      <PageHeader
        title="Neraca"
        subtitle={`Posisi keuangan per ${asOfDate}`}
        breadcrumb={["Home", "Laporan", "Neraca"]}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile label="Total Aset" value={formatRupiah(r.totalAsset)} icon={Wallet} tone="blue" />
        <Tile
          label="Total Kewajiban"
          value={formatRupiah(r.totalLiability)}
          icon={TrendingDown}
          tone="negative"
        />
        <Tile
          label="Total Modal + Laba"
          value={formatRupiah(r.totalEquity)}
          icon={PiggyBank}
          tone="positive"
        />
      </div>

      <Card className="flex items-center gap-3">
        {r.balanced ? (
          <CheckCircle2 size={18} className="text-sap-positive" />
        ) : (
          <AlertTriangle size={18} className="text-sap-critical" />
        )}
        <span className="text-sm font-medium">
          {r.balanced
            ? "Neraca seimbang — Aset = Kewajiban + Modal"
            : "Neraca belum seimbang, periksa kembali entri jurnal"}
        </span>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader title="Aset" description={`${r.assetAccounts.length} akun`} icon={Wallet} />
          <Table>
            <thead>
              <tr>
                <Th className="w-24">Kode</Th>
                <Th>Nama Akun</Th>
                <Th align="right" className="w-44">
                  Saldo
                </Th>
              </tr>
            </thead>
            <tbody>
              {r.assetAccounts.map((a) => (
                <tr key={a.id} className="hover:bg-sap-hover">
                  <Td>
                    <Code>{a.code}</Code>
                  </Td>
                  <Td>{a.name}</Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    {formatRupiah(a.balance)}
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-sap-header">
                <Td colSpan={2} className="font-semibold">
                  Total Aset
                </Td>
                <Td align="right" className="font-bold tabular-nums">
                  {formatRupiah(r.totalAsset)}
                </Td>
              </tr>
            </tfoot>
          </Table>
        </Card>

        <Card padded={false}>
          <CardHeader
            title="Kewajiban & Modal"
            description="Sisi kredit neraca"
            icon={PiggyBank}
          />
          <Table>
            <thead>
              <tr>
                <Th className="w-24">Kode</Th>
                <Th>Nama Akun</Th>
                <Th align="right" className="w-44">
                  Saldo
                </Th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-sap-header">
                <Td colSpan={3} className="text-[11px] font-semibold uppercase tracking-wide text-sap-label">
                  Kewajiban
                </Td>
              </tr>
              {r.liabilityAccounts.map((a) => (
                <tr key={a.id} className="hover:bg-sap-hover">
                  <Td>
                    <Code>{a.code}</Code>
                  </Td>
                  <Td>{a.name}</Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    {formatRupiah(a.balance)}
                  </Td>
                </tr>
              ))}

              <tr className="bg-sap-header">
                <Td colSpan={3} className="text-[11px] font-semibold uppercase tracking-wide text-sap-label">
                  Modal
                </Td>
              </tr>
              {r.equityAccounts.map((a) => (
                <tr key={a.id} className="hover:bg-sap-hover">
                  <Td>
                    <Code>{a.code}</Code>
                  </Td>
                  <Td>{a.name}</Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    {formatRupiah(a.balance)}
                  </Td>
                </tr>
              ))}
              <tr className="hover:bg-sap-hover">
                <Td />
                <Td>Laba Berjalan (tahun ini)</Td>
                <Td align="right" className="font-semibold tabular-nums">
                  {formatRupiah(r.currentYearIncome)}
                </Td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-sap-header">
                <Td colSpan={2} className="font-semibold">
                  Total Kewajiban + Modal
                </Td>
                <Td align="right" className="font-bold tabular-nums">
                  {formatRupiah(r.totalLiabilityEquity)}
                </Td>
              </tr>
            </tfoot>
          </Table>
        </Card>
      </div>
    </>
  );
}
