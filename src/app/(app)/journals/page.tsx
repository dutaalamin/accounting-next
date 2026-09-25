import Link from "next/link";
import { ArrowUpRight, Inbox, PenLine } from "lucide-react";
import { getAccounts, getJournalEntries } from "@/lib/queries";
import { formatRupiah } from "@/lib/format";
import { PageHeader, Card, CardHeader, Badge, Table, Th, Td, EmptyState } from "@/components/ui";
import { JournalForm } from "./journal-form";

export const dynamic = "force-dynamic";

export default async function JournalsPage() {
  const [accounts, entries] = await Promise.all([getAccounts(), getJournalEntries()]);
  const recent = [...entries].reverse();

  return (
    <>
      <PageHeader
        title="Transaksi Harian"
        subtitle="Input jurnal umum (double-entry) — total debit harus sama dengan total kredit"
      />

      <JournalForm accounts={accounts} />

      <Card padded={false}>
        <CardHeader
          title="Riwayat Jurnal"
          description={`${entries.length} jurnal tercatat`}
          icon={Inbox}
          action={
            <Link
              href="/journals"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Refresh <ArrowUpRight size={13} />
            </Link>
          }
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
              <Th align="right" className="w-40">
                Total
              </Th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <EmptyState
                icon={PenLine}
                title="Belum ada jurnal"
                description="Catat transaksi pertama kamu lewat form di atas."
                colSpan={5}
              />
            )}
            {recent.map((e) => (
              <tr key={e.id} className="group transition hover:bg-slate-50/70">
                <Td className="text-slate-500">{e.date}</Td>
                <Td>
                  <Link
                    href={`/journals/${e.id}`}
                    className="font-medium text-indigo-600 transition hover:text-indigo-700 hover:underline"
                  >
                    {e.referenceNumber}
                  </Link>
                </Td>
                <Td className="text-slate-600">{e.description ?? "—"}</Td>
                <Td align="center">
                  <Badge tone="slate">{e.lineCount}</Badge>
                </Td>
                <Td align="right" className="font-semibold tabular-nums text-slate-900">
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
