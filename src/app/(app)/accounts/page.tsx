import { Wallet } from "lucide-react";
import { getAccounts, getJournalLines } from "@/lib/queries";
import { balanceUntil } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import { ACCOUNT_TYPE_LABELS } from "@/db/coa";
import { PageHeader, Card, CardHeader, Badge, Table, Th, Td, EmptyState } from "@/components/ui";
import type { Tone } from "@/components/ui";
import { AccountForm } from "./account-form";

export const dynamic = "force-dynamic";

const TYPE_TONE: Record<string, Tone> = {
  asset: "indigo",
  liability: "rose",
  equity: "amber",
  revenue: "emerald",
  expense: "slate",
};

export default async function AccountsPage() {
  const [accounts, lines] = await Promise.all([getAccounts(), getJournalLines()]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Akun & Dompet"
        subtitle={`${accounts.length} akun aktif · saldo dihitung sampai ${today}`}
      />

      <AccountForm />

      <Card padded={false}>
        <CardHeader
          title="Chart of Accounts"
          description="Daftar seluruh akun beserta saldo berjalan"
          icon={Wallet}
        />
        <Table>
          <thead>
            <tr>
              <Th className="w-24">Kode</Th>
              <Th>Nama Akun</Th>
              <Th className="w-32">Tipe</Th>
              <Th align="right" className="w-44">
                Saldo
              </Th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 && (
              <EmptyState
                icon={Wallet}
                title="Belum ada akun"
                description="Tambahkan akun pertama di form di atas."
                colSpan={4}
              />
            )}
            {accounts.map((a) => {
              const balance = balanceUntil(a, lines, today);
              return (
                <tr key={a.id} className="group transition hover:bg-slate-50/70">
                  <Td>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
                      {a.code}
                    </span>
                  </Td>
                  <Td className="font-medium text-slate-800">{a.name}</Td>
                  <Td>
                    <Badge tone={TYPE_TONE[a.type] ?? "slate"}>
                      {ACCOUNT_TYPE_LABELS[a.type]}
                    </Badge>
                  </Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    <span className={balance < 0 ? "text-rose-600" : "text-slate-900"}>
                      {formatRupiah(balance)}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
