import { Wallet } from "lucide-react";
import { getAccounts, getJournalLines } from "@/lib/queries";
import { balanceUntil } from "@/lib/accounting/reports";
import { formatRupiah } from "@/lib/format";
import { ACCOUNT_TYPE_LABELS } from "@/db/coa";
import {
  PageHeader,
  Card,
  CardHeader,
  Table,
  Th,
  Td,
  Code,
  EmptyState,
  InfoLabel,
  type InfoTone,
} from "@/components/ui";
import { AccountForm } from "./account-form";
import { ExportButton } from "@/components/export-button";

export const dynamic = "force-dynamic";

const TYPE_TONE: Record<string, InfoTone> = {
  asset: "blue",
  liability: "negative",
  equity: "critical",
  revenue: "positive",
  expense: "neutral",
};

export default async function AccountsPage() {
  const [accounts, lines] = await Promise.all([getAccounts(), getJournalLines()]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Chart of Accounts"
        subtitle={`${accounts.length} akun aktif · saldo per ${today}`}
        breadcrumb={["Home", "Akun"]}
        action={<ExportButton type="accounts" />}
      />

      <AccountForm />

      <Card padded={false}>
        <CardHeader
          title="Daftar Akun & Dompet"
          description="Saldo berjalan tiap akun"
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
                description="Tambahkan akun pertama lewat form di atas."
                colSpan={4}
              />
            )}
            {accounts.map((a) => {
              const balance = balanceUntil(a, lines, today);
              return (
                <tr key={a.id} className="hover:bg-sap-hover">
                  <Td>
                    <Code>{a.code}</Code>
                  </Td>
                  <Td className="font-medium">{a.name}</Td>
                  <Td>
                    <InfoLabel tone={TYPE_TONE[a.type] ?? "neutral"}>
                      {ACCOUNT_TYPE_LABELS[a.type]}
                    </InfoLabel>
                  </Td>
                  <Td
                    align="right"
                    className={`font-semibold tabular-nums ${
                      balance < 0 ? "text-sap-negative" : "text-sap-text"
                    }`}
                  >
                    {formatRupiah(balance)}
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
