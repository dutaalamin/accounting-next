import { BookOpen, Filter } from "lucide-react";
import { getAccounts, getJournalLines } from "@/lib/queries";
import { balanceUntil } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import { PageHeader, Card, CardHeader, Table, Th, Td, Button, inputCls, labelCls } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BukuBesarPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const startDate = sp.start ?? `${now.getFullYear()}-01-01`;
  const endDate = sp.end ?? now.toISOString().slice(0, 10);

  const [accounts, lines] = await Promise.all([getAccounts(), getJournalLines()]);
  const selectedId = sp.account ? Number(sp.account) : null;
  const account = selectedId ? accounts.find((a) => a.id === selectedId) : null;

  const mutations = account
    ? lines
        .filter((l) => l.accountId === account.id && l.isPosted && !l.deleted)
        .filter((l) => l.date >= startDate && l.date <= endDate)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((l) => ({ date: l.date, debit: l.debit, credit: l.credit }))
    : [];

  const opening = account ? balanceUntil(account, lines, shiftDay(startDate, -1)) : 0;

  const rows = mutations.reduce<
    { date: string; debit: number; credit: number; balance: number }[]
  >((acc, m) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].balance : opening;
    acc.push({ ...m, balance: prev + m.debit - m.credit });
    return acc;
  }, []);

  return (
    <>
      <PageHeader
        title="Buku Besar"
        subtitle="Pilih akun dan rentang tanggal untuk melihat mutasi & saldo berjalan"
        breadcrumb={["Home", "Laporan", "Buku Besar"]}
      />

      <Card padded={false}>
        <CardHeader title="Filter" description="Akun & periode" icon={Filter} />
        <form className="p-4" method="get">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className={labelCls}>Pilih Akun</label>
              <select name="account" defaultValue={sp.account ?? ""} className={inputCls}>
                <option value="">— Pilih akun —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} · {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Dari Tanggal</label>
              <input type="date" name="start" defaultValue={startDate} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sampai Tanggal</label>
              <input type="date" name="end" defaultValue={endDate} className={inputCls} />
            </div>
          </div>
          <div className="mt-4">
            <Button type="submit" variant="emphasized">
              Tampilkan
            </Button>
          </div>
        </form>
      </Card>

      {!account && (
        <Card className="py-12">
          <div className="flex flex-col items-center text-center">
            <BookOpen size={30} strokeWidth={1.5} className="mb-3 text-sap-border" />
            <p className="text-sm font-medium">Pilih akun untuk memulai</p>
            <p className="mt-1 max-w-sm text-xs text-sap-label">
              Pilih akun dari dropdown di atas, lalu klik Tampilkan.
            </p>
          </div>
        </Card>
      )}

      {account && (
        <Card padded={false}>
          <CardHeader
            title={`Mutasi — ${account.code} · ${account.name}`}
            description={`${rows.length} mutasi pada periode ini`}
            icon={BookOpen}
          />
          <Table>
            <thead>
              <tr>
                <Th className="w-40">Tanggal</Th>
                <Th align="right" className="w-48">
                  Debit
                </Th>
                <Th align="right" className="w-48">
                  Kredit
                </Th>
                <Th align="right" className="w-48">
                  Saldo
                </Th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-sap-header">
                <Td className="font-medium">Saldo Awal</Td>
                <Td align="right" className="text-sap-border">
                  —
                </Td>
                <Td align="right" className="text-sap-border">
                  —
                </Td>
                <Td align="right" className="font-semibold tabular-nums">
                  {formatRupiah(opening)}
                </Td>
              </tr>
              {rows.length === 0 && (
                <tr>
                  <Td colSpan={4} className="py-8 text-center text-sap-label">
                    Tidak ada mutasi pada periode ini.
                  </Td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-sap-hover">
                  <Td className="text-sap-label">{r.date}</Td>
                  <Td align="right" className="tabular-nums">
                    {r.debit ? formatRupiah(r.debit) : <span className="text-sap-border">—</span>}
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {r.credit ? formatRupiah(r.credit) : <span className="text-sap-border">—</span>}
                  </Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    {formatRupiah(r.balance)}
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-sap-header">
                <Td className="font-semibold">Saldo Akhir</Td>
                <Td colSpan={2} />
                <Td align="right" className="font-bold tabular-nums">
                  {formatRupiah(rows.length > 0 ? rows[rows.length - 1].balance : opening)}
                </Td>
              </tr>
            </tfoot>
          </Table>
        </Card>
      )}
    </>
  );
}

function shiftDay(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
