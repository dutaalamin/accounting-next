import { BookOpen, Filter } from "lucide-react";
import { getAccounts, getJournalLines } from "@/lib/queries";
import { balanceUntil } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import { PageHeader, Card, CardHeader, Table, Th, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";

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
      />

      <Card padded={false}>
        <CardHeader title="Filter" description="Akun & periode" icon={Filter} />
        <form className="p-5" method="get">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Pilih Akun</label>
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
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Dari Tanggal</label>
              <input type="date" name="start" defaultValue={startDate} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Sampai Tanggal</label>
              <input type="date" name="end" defaultValue={endDate} className={inputCls} />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Tampilkan
          </button>
        </form>
      </Card>

      {!account && (
        <Card className="py-14">
          <div className="flex flex-col items-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <BookOpen size={22} strokeWidth={1.8} />
            </span>
            <p className="text-sm font-medium text-slate-700">Pilih akun untuk memulai</p>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              Pilih akun dari dropdown di atas, lalu klik Tampilkan untuk melihat mutasi buku besar.
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
              <tr className="bg-slate-50/60">
                <Td className="font-medium text-slate-600">Saldo Awal</Td>
                <Td align="right" className="text-slate-300">
                  —
                </Td>
                <Td align="right" className="text-slate-300">
                  —
                </Td>
                <Td align="right" className="font-semibold tabular-nums text-slate-900">
                  {formatRupiah(opening)}
                </Td>
              </tr>
              {rows.length === 0 && (
                <tr>
                  <Td colSpan={4} className="py-8 text-center text-slate-400 italic">
                    Tidak ada mutasi pada periode ini.
                  </Td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={i} className="transition hover:bg-slate-50/70">
                  <Td className="text-slate-600">{r.date}</Td>
                  <Td align="right" className="tabular-nums text-slate-800">
                    {r.debit ? formatRupiah(r.debit) : <span className="text-slate-300">—</span>}
                  </Td>
                  <Td align="right" className="tabular-nums text-slate-800">
                    {r.credit ? formatRupiah(r.credit) : <span className="text-slate-300">—</span>}
                  </Td>
                  <Td align="right" className="font-semibold tabular-nums text-slate-900">
                    {formatRupiah(r.balance)}
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/80">
                <Td className="font-bold text-slate-900">Saldo Akhir</Td>
                <Td colSpan={2} />
                <Td align="right" className="font-bold tabular-nums text-slate-900">
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
