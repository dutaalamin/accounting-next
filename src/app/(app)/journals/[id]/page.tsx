import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getJournalEntry } from "@/lib/queries";
import { formatRupiah } from "@/lib/format";
import {
  PageHeader,
  Card,
  CardHeader,
  Table,
  Th,
  Td,
  Code,
  InfoLabel,
  Button,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getJournalEntry(Number(id));
  if (!entry) notFound();

  const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);

  return (
    <>
      <PageHeader
        title={`Jurnal ${entry.referenceNumber}`}
        subtitle={`${entry.date}, ${entry.description ?? "Tanpa keterangan"}`}
        breadcrumb={["Home", "Transaksi", entry.referenceNumber]}
        action={
          <Link href="/journals">
            <Button variant="ghost" icon={ArrowLeft}>
              Kembali
            </Button>
          </Link>
        }
      />

      <Card padded={false}>
        <CardHeader
          title="Baris Jurnal"
          description={`${entry.lines.length} baris`}
          action={
            <InfoLabel tone={entry.isPosted ? "positive" : "critical"}>
              {entry.isPosted ? "Posted" : "Draft"}
            </InfoLabel>
          }
        />
        <Table>
          <thead>
            <tr>
              <Th>Akun</Th>
              <Th>Keterangan</Th>
              <Th align="right" className="w-44">
                Debit
              </Th>
              <Th align="right" className="w-44">
                Kredit
              </Th>
            </tr>
          </thead>
          <tbody>
            {entry.lines.map((l) => (
              <tr key={l.id} className="hover:bg-sap-hover">
                <Td>
                  <div className="flex items-center gap-2">
                    <Code>{l.accountCode}</Code>
                    <span className="font-medium">{l.accountName}</span>
                  </div>
                </Td>
                <Td className="text-sap-label">{l.description ?? "—"}</Td>
                <Td align="right" className="font-semibold tabular-nums">
                  {l.debit ? formatRupiah(l.debit) : <span className="text-sap-border">—</span>}
                </Td>
                <Td align="right" className="font-semibold tabular-nums">
                  {l.credit ? formatRupiah(l.credit) : <span className="text-sap-border">—</span>}
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-sap-header">
              <Td colSpan={2} className="font-semibold">
                Total
              </Td>
              <Td align="right" className="font-bold tabular-nums">
                {formatRupiah(totalDebit)}
              </Td>
              <Td align="right" className="font-bold tabular-nums">
                {formatRupiah(totalCredit)}
              </Td>
            </tr>
          </tfoot>
        </Table>
      </Card>
    </>
  );
}
