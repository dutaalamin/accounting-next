import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { getJournalEntry } from "@/lib/queries";
import { formatRupiah } from "@/lib/format";
import { PageHeader, Card, CardHeader, Badge, Table, Th, Td } from "@/components/ui";

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
      <Link
        href="/journals"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft size={15} />
        Kembali ke daftar jurnal
      </Link>

      <PageHeader
        title={entry.referenceNumber}
        subtitle={`${entry.date} · ${entry.description ?? "Tanpa keterangan"}`}
        action={
          <Badge tone={entry.isPosted ? "emerald" : "amber"}>
            <span className="inline-flex items-center gap-1.5">
              {entry.isPosted ? <CheckCircle2 size={13} /> : <Clock size={13} />}
              {entry.isPosted ? "Posted" : "Draft"}
            </span>
          </Badge>
        }
      />

      <Card padded={false}>
        <CardHeader title="Baris Jurnal" description={`${entry.lines.length} baris`} />
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
              <tr key={l.id} className="transition hover:bg-slate-50/70">
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
                      {l.accountCode}
                    </span>
                    <span className="font-medium text-slate-800">{l.accountName}</span>
                  </div>
                </Td>
                <Td className="text-slate-500">{l.description ?? "—"}</Td>
                <Td align="right" className="font-semibold tabular-nums text-slate-900">
                  {l.debit ? formatRupiah(l.debit) : <span className="text-slate-300">—</span>}
                </Td>
                <Td align="right" className="font-semibold tabular-nums text-slate-900">
                  {l.credit ? formatRupiah(l.credit) : <span className="text-slate-300">—</span>}
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50/80">
              <Td colSpan={2} className="font-semibold text-slate-700">
                Total
              </Td>
              <Td align="right" className="font-bold tabular-nums text-slate-900">
                {formatRupiah(totalDebit)}
              </Td>
              <Td align="right" className="font-bold tabular-nums text-slate-900">
                {formatRupiah(totalCredit)}
              </Td>
            </tr>
          </tfoot>
        </Table>
      </Card>
    </>
  );
}
