import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { getSupplierInvoice } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { CancelInvoiceButton } from "@/components/cancel-invoice-button";
import { WhatsappInvoiceButton } from "@/components/whatsapp-invoice-button";
import { cancelSupplierInvoice } from "../../invoices/actions";
import { formatRupiah } from "@/lib/format";
import {
  PageHeader,
  Card,
  CardHeader,
  Table,
  Th,
  Td,
  InfoLabel,
  Button,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SupplierInvoiceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await getSupplierInvoice(Number(id));
  if (!inv) notFound();
  const user = await getSessionUser();

  const subtotal = inv.lines.reduce((s, l) => s + l.subtotal, 0);

  return (
    <>
      <PageHeader
        title={`Tagihan ${inv.invoiceNumber}`}
        subtitle={`${inv.partyName}, ${inv.invoiceDate}`}
        breadcrumb={["Home", "Tagihan Pemasok", inv.invoiceNumber]}
        action={
          <div className="flex gap-2">
            <Link href="/supplier-invoices">
              <Button variant="ghost" icon={ArrowLeft}>
                Kembali
              </Button>
            </Link>
            <WhatsappInvoiceButton
              invoiceNumber={inv.invoiceNumber}
              partyName={inv.partyName}
              partyPhone={inv.partyPhone}
              invoiceDate={inv.invoiceDate}
              dueDate={inv.dueDate}
              totalAmount={inv.totalAmount}
              status={inv.status}
              lines={inv.lines}
              companyName="PT Cahaya Tiga Putri Mandiri"
            />
            <Link href={`/supplier-invoices/${inv.id}/print`} target="_blank">
              <Button variant="default" icon={Printer}>
                Cetak
              </Button>
            </Link>
          </div>
        }
      />

      <Card className="flex items-center gap-3">
        <span className="text-sm text-sap-label">Status pembayaran:</span>
        <InfoLabel tone={inv.status === "paid" ? "positive" : "critical"}>
          {inv.status === "paid" ? "Lunas" : "Belum Lunas"}
        </InfoLabel>
        {inv.dueDate && (
          <span className="ml-auto text-xs text-sap-label">Jatuh tempo: {inv.dueDate}</span>
        )}
      </Card>

      <Card padded={false}>
        <CardHeader title="Rincian Barang / Jasa" description={`${inv.lines.length} baris`} />
        <Table>
          <thead>
            <tr>
              <Th>Produk / Keterangan</Th>
              <Th align="right" className="w-20">
                Qty
              </Th>
              <Th align="right" className="w-40">
                Harga
              </Th>
              <Th align="right" className="w-40">
                Subtotal
              </Th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={l.id} className="hover:bg-sap-hover">
                <Td>
                  <span className="font-medium">{l.productName ?? "—"}</span>
                  {l.description && l.description !== l.productName && (
                    <span className="block text-xs text-sap-label">{l.description}</span>
                  )}
                </Td>
                <Td align="right" className="tabular-nums">
                  {l.quantity}
                </Td>
                <Td align="right" className="tabular-nums">
                  {formatRupiah(l.unitPrice)}
                </Td>
                <Td align="right" className="font-semibold tabular-nums">
                  {formatRupiah(l.subtotal)}
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-sap-header">
              <Td colSpan={3} align="right" className="text-sap-label">
                Subtotal
              </Td>
              <Td align="right" className="font-semibold tabular-nums">
                {formatRupiah(subtotal)}
              </Td>
            </tr>
            <tr className="bg-sap-header">
              <Td colSpan={3} align="right" className="text-sap-label">
                PPN ({inv.taxPercentage}%)
              </Td>
              <Td align="right" className="font-semibold tabular-nums">
                {formatRupiah(inv.taxAmount)}
              </Td>
            </tr>
            <tr className="bg-sap-header">
              <Td colSpan={3} align="right" className="font-bold">
                Total
              </Td>
              <Td align="right" className="font-bold tabular-nums">
                {formatRupiah(inv.totalAmount)}
              </Td>
            </tr>
          </tfoot>
        </Table>
      </Card>

      {inv.notes && (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-sap-label">Catatan</p>
          <p className="mt-1 text-sm">{inv.notes}</p>
        </Card>
      )}

      {user?.role === "admin" && (
        <Card>
          <p className="text-sm font-semibold text-sap-text">Koreksi</p>
          <p className="mb-3 mt-1 text-xs text-sap-label">
            Membatalkan tagihan akan membuat jurnal pembalik. Riwayat tetap tersimpan.
          </p>
          <CancelInvoiceButton
            id={inv.id}
            kind="supplier"
            action={cancelSupplierInvoice}
            label="Batalkan Tagihan"
          />
        </Card>
      )}
    </>
  );
}
