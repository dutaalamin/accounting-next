import { getAccounts, getJournalLines } from "@/lib/queries";
import { balanceUntil } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";

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

  // Baris mutasi untuk akun terpilih (hanya yang valid & dalam rentang).
  const mutations = account
    ? lines
        .filter((l) => l.accountId === account.id && l.isPosted && !l.deleted)
        .filter((l) => l.date >= startDate && l.date <= endDate)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((l) => ({ date: l.date, debit: l.debit, credit: l.credit }))
    : [];

  const opening = account
    ? balanceUntil(account, lines, shiftDay(startDate, -1))
    : 0;

  // Hitung saldo berjalan tanpa memutasi variabel di dalam map
  // (aturan react-hooks/immutability).
  const rows = mutations.reduce<{ date: string; debit: number; credit: number; balance: number }[]>(
    (acc, m) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].balance : opening;
      acc.push({ ...m, balance: prev + m.debit - m.credit });
      return acc;
    },
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Laporan Buku Besar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pilih akun dan rentang tanggal untuk melihat mutasi &amp; saldo berjalan.
        </p>
      </div>

      <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" method="get">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Pilih Akun</label>
            <select
              name="account"
              defaultValue={sp.account ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">— Pilih akun —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Dari Tanggal</label>
            <input
              type="date"
              name="start"
              defaultValue={startDate}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Sampai Tanggal</label>
            <input
              type="date"
              name="end"
              defaultValue={endDate}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Tampilkan
        </button>
      </form>

      {!account && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-700">Pilih Akun untuk Memulai</p>
          <p className="mt-1 text-sm text-slate-500">
            Silakan pilih akun dari dropdown di atas untuk menampilkan mutasi buku besar.
          </p>
        </div>
      )}

      {account && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold tracking-wide text-slate-700">
              Mutasi Buku Besar — {account.code} · {account.name}
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3 text-right">Debit</th>
                <th className="px-5 py-3 text-right">Kredit</th>
                <th className="px-5 py-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="bg-slate-50/60">
                <td className="px-5 py-3 font-medium text-slate-600">Saldo Awal</td>
                <td className="px-5 py-3 text-right text-slate-400">—</td>
                <td className="px-5 py-3 text-right text-slate-400">—</td>
                <td className="px-5 py-3 text-right font-semibold text-slate-800">
                  {formatRupiah(opening)}
                </td>
              </tr>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-slate-400 italic">
                    Tidak ada mutasi pada periode ini.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 text-slate-600">{r.date}</td>
                  <td className="px-5 py-3 text-right text-slate-800">
                    {r.debit ? formatRupiah(r.debit) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-800">
                    {r.credit ? formatRupiah(r.credit) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900">
                    {formatRupiah(r.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function shiftDay(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
