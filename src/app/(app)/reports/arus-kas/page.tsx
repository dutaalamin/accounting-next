import { TrendingUp, TrendingDown, Wallet, CalendarDays } from "lucide-react";
import { getAccounts, getJournalLines } from "@/lib/queries";
import { buildArusKas, type CashFlowDetail } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import { PageHeader, Card, CardHeader, StatCard, Table, Th, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ArusKasPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const startDate = sp.start ?? `${now.getFullYear()}-01-01`;
  const endDate = sp.end ?? now.toISOString().slice(0, 10);

  const [accounts, lines] = await Promise.all([getAccounts(), getJournalLines()]);
  const r = buildArusKas(accounts, lines, startDate, endDate);

  const surplus = r.netChange >= 0;

  return (
    <>
      <PageHeader
        title="Arus Kas"
        subtitle={`Metode tidak langsung · ${startDate} — ${endDate}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Saldo Kas Awal"
          value={formatRupiah(r.openingCash)}
          icon={Wallet}
          tone="slate"
        />
        <StatCard
          label="Perubahan Kas Bersih"
          value={formatRupiah(r.netChange)}
          icon={surplus ? TrendingUp : TrendingDown}
          tone={surplus ? "emerald" : "rose"}
        />
        <StatCard
          label="Saldo Kas Akhir"
          value={formatRupiah(r.closingCash)}
          icon={Wallet}
          tone="indigo"
        />
      </div>

      <Card
        className={`flex items-center gap-3 ${
          surplus ? "!border-emerald-200 !bg-emerald-50/60" : "!border-rose-200 !bg-rose-50/60"
        }`}
      >
        {surplus ? (
          <TrendingUp size={20} className="text-emerald-600" />
        ) : (
          <TrendingDown size={20} className="text-rose-600" />
        )}
        <p className={`text-sm font-semibold ${surplus ? "text-emerald-800" : "text-rose-800"}`}>
          Status kas periode ini: {surplus ? "Surplus" : "Defisit"} sebesar{" "}
          {formatRupiah(Math.abs(r.netChange))}
        </p>
      </Card>

      <ActivityTable
        title="Aktivitas Operasi"
        accent="text-emerald-600"
        details={r.operatingDetails}
        total={r.operatingFlow}
        emptyText="Tidak ada aktivitas operasi pada periode ini."
      />
      <ActivityTable
        title="Aktivitas Investasi"
        accent="text-amber-600"
        details={r.investingDetails}
        total={r.investingFlow}
        emptyText="Tidak ada aktivitas investasi pada periode ini."
      />
      <ActivityTable
        title="Aktivitas Pendanaan"
        accent="text-violet-600"
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
        <div className="p-5">
          <ReconRow label={`Saldo Kas Awal (per ${startDate})`} value={r.openingCash} />
          <ReconRow label="Total Kenaikan / Penurunan Kas Bersih" value={r.netChange} />
          <div className="mt-3 flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
            <span className="text-sm font-bold text-indigo-700">
              Saldo Kas Akhir (per {endDate})
            </span>
            <span className="text-base font-bold tabular-nums text-indigo-700">
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
  accent,
  details,
  total,
  emptyText,
}: {
  title: string;
  accent: string;
  details: CashFlowDetail[];
  total: number;
  emptyText: string;
}) {
  return (
    <Card padded={false}>
      <CardHeader title={title} description={`${details.length} akun`} accent={accent} />
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
              <Td colSpan={3} className="py-8 text-center text-slate-400 italic">
                {emptyText}
              </Td>
            </tr>
          )}
          {details.map((d) => (
            <tr key={d.code} className="transition hover:bg-slate-50/70">
              <Td>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                  {d.code}
                </span>
              </Td>
              <Td className="text-slate-700">{d.name}</Td>
              <Td
                align="right"
                className={`font-semibold tabular-nums ${
                  d.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatRupiah(d.amount)}
              </Td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50/80">
            <Td colSpan={2} className="font-bold text-slate-900">
              Arus Kas Bersih
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

function ReconRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-slate-900">
        {formatRupiah(value)}
      </span>
    </div>
  );
}
