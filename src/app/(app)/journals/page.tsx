import Link from "next/link";
import { Inbox, PenLine } from "lucide-react";
import { getAccounts, getJournalEntries } from "@/lib/queries";
import { formatRupiah } from "@/lib/format";
import {
  PageHeader,
  Card,
  CardHeader,
  Table,
  Th,
  Td,
  InfoLabel,
  EmptyState,
} from "@/components/ui";
import { JournalForm } from "./journal-form";
import { ExportButton } from "@/components/export-button";

export const dynamic = "force-dynamic";

export default async function JournalsPage() {
  const [accounts, entries] = await Promise.all([getAccounts(), getJournalEntries()]);
  const recent = [...entries].reverse();

  return (
    <>
      <PageHeader
        title="Catat Transaksi Harian"
        subtitle="Input jurnal umum (double-entry) — total debit harus sama dengan total kredit"
        breadcrumb={["Home", "Transaksi"]}
        action={<ExportButton type="journals" />}
      />

      <JournalForm accounts={accounts} />

      <Card padded={false}>
        <CardHeader
          title="Riwayat Jurnal"
          description={`${entries.length} jurnal tercatat`}
          icon={Inbox}
        />
        <Table>
          <thead>
            <tr>
              <Th className="w-32">Tanggal</Th>
              <Th className="w-40">No. Bukti</Th>
              <Th>Keterangan</Th>
              <Th align="center" className="w-20">
                Baris
              </Th>
              <Th align="center" className="w-28">
                Status
              </Th>
              <Th align="right" className="w-40">
                Total
              </Th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <EmptyState
                icon={PenLine}
                title="Belum ada jurnal"
                description="Catat transaksi pertama lewat form di atas."
                colSpan={6}
              />
            )}
            {recent.map((e) => (
              <tr key={e.id} className="hover:bg-sap-hover">
                <Td className="text-sap-label">{e.date}</Td>
                <Td>
                  <Link
                    href={`/journals/${e.id}`}
                    className="font-medium text-sap-blue hover:underline"
                  >
                    {e.referenceNumber}
                  </Link>
                </Td>
                <Td className="text-sap-label">{e.description ?? "—"}</Td>
                <Td align="center" className="text-sap-label">
                  {e.lineCount}
                </Td>
                <Td align="center">
                  <InfoLabel tone={e.isPosted ? "positive" : "critical"}>
                    {e.isPosted ? "Posted" : "Draft"}
                  </InfoLabel>
                </Td>
                <Td align="right" className="font-semibold tabular-nums">
                  {formatRupiah(e.total)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
