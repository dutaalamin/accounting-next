import {
  Wallet,
  TrendingDown,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from "lucide-react";
import { getAccounts, getJournalLines } from "@/lib/queries";
import { buildNeraca } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import { PageHeader, Card, CardHeader, StatCard, Table, Th, Td } from "@/components/ui";

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
      <PageHeader title="Neraca" subtitle={`Posisi keuangan per ${asOfDate}`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Aset" value={formatRupiah(r.totalAsset)} icon={Wallet} tone="indigo" />
        <StatCard
          label="Total Kewajiban"
          value={formatRupiah(r.totalLiability)}
          icon={TrendingDown}
          tone="rose"
        />
        <StatCard
          label="Total Modal + Laba"
          value={formatRupiah(r.totalEquity)}
          icon={PiggyBank}
          tone="emerald"
        />
      </div>

      <Card
        className={`flex items-center gap-3 ${
          r.balanced ? "!border-emerald-200 !bg-emerald-50/60" : "!border-rose-200 !bg-rose-50/60"
        }`}
      >
        {r.balanced ? (
          <CheckCircle2 size={20} className="text-emerald-600" />
        ) : (
          <AlertTriangle size={20} className="text-rose-600" />
        )}
        <p
          className={`text-sm font-semibold ${r.balanced ? "text-emerald-800" : "text-rose-800"}`}
        >
          {r.balanced
            ? "Neraca seimbang — Aset = Kewajiban + Modal"
            : "Neraca belum seimbang, periksa kembali entri jurnal"}
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader
            title="Aset"
            description={`${r.assetAccounts.length} akun`}
            icon={Wallet}
            accent="text-indigo-500"
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
              {r.assetAccounts.map((a) => (
                <tr key={a.id} className="transition hover:bg-slate-50/70">
                  <Td>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                      {a.code}
                    </span>
                  </Td>
                  <Td className="text-slate-700">{a.name}</Td>
                  <Td align="right" className="font-semibold tabular-nums text-slate-900">
                    {formatRupiah(a.balance)}
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/80">
                <Td colSpan={2} className="font-bold text-slate-900">
                  Total Aset
                </Td>
                <Td align="right" className="font-bold tabular-nums text-slate-900">
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
            icon={Scale}
            accent="text-violet-500"
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
              <tr className="bg-slate-50/50">
                <Td colSpan={3} className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Kewajiban
                </Td>
              </tr>
              {r.liabilityAccounts.map((a) => (
                <tr key={a.id} className="transition hover:bg-slate-50/70">
                  <Td>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                      {a.code}
                    </span>
                  </Td>
                  <Td className="text-slate-700">{a.name}</Td>
                  <Td align="right" className="font-semibold tabular-nums text-slate-900">
                    {formatRupiah(a.balance)}
                  </Td>
                </tr>
              ))}

              <tr className="bg-slate-50/50">
                <Td colSpan={3} className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Modal
                </Td>
              </tr>
              {r.equityAccounts.map((a) => (
                <tr key={a.id} className="transition hover:bg-slate-50/70">
                  <Td>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                      {a.code}
                    </span>
                  </Td>
                  <Td className="text-slate-700">{a.name}</Td>
                  <Td align="right" className="font-semibold tabular-nums text-slate-900">
                    {formatRupiah(a.balance)}
                  </Td>
                </tr>
              ))}
              <tr className="transition hover:bg-slate-50/70">
                <Td />
                <Td className="text-slate-700">Laba Berjalan (tahun ini)</Td>
                <Td align="right" className="font-semibold tabular-nums text-slate-900">
                  {formatRupiah(r.currentYearIncome)}
                </Td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/80">
                <Td colSpan={2} className="font-bold text-slate-900">
                  Total Kewajiban + Modal
                </Td>
                <Td align="right" className="font-bold tabular-nums text-slate-900">
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
