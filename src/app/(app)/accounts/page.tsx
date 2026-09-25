import { getAccounts, getJournalLines } from "@/lib/queries";
import { balanceUntil } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import { ACCOUNT_TYPE_LABELS } from "@/db/coa";
import { AccountForm } from "./account-form";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const [accounts, lines] = await Promise.all([getAccounts(), getJournalLines()]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Daftar Akun / Dompet</h1>
        <p className="mt-1 text-sm text-slate-500">
          {accounts.length} akun aktif. Saldo dihitung sampai {today}.
        </p>
      </div>

      <AccountForm />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Nama Akun</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                  Belum ada akun.
                </td>
              </tr>
            )}
            {accounts.map((a) => {
              const balance = balanceUntil(a, lines, today);
              return (
                <tr key={a.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                      {a.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.name}</td>
                  <td className="px-4 py-3 text-slate-500">{ACCOUNT_TYPE_LABELS[a.type]}</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      balance < 0 ? "text-rose-600" : "text-slate-800"
                    }`}
                  >
                    {formatRupiah(balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
