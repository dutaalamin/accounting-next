import Link from "next/link";
import { FileText, Receipt } from "lucide-react";
import { getSupplierInvoices, getVendors, getProducts } from "@/lib/queries";
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
import { ExportButton } from "@/components/export-button";
import { InvoiceForm } from "../invoices/invoice-form";
import { createSupplierInvoiceAction } from "../invoices/actions";

export const dynamic = "force-dynamic";

export default async function SupplierInvoicesPage() {
  const [rows, vendors, products] = await Promise.all([
    getSupplierInvoices(),
    getVendors(),
    getProducts(),
  ]);

  return (
    <>
      <PageHeader
        title="Tagihan Pemasok"
        subtitle="Tagihan pembelian, jurnal ter-posting otomatis"
        breadcrumb={["Home", "Hutang Usaha", "Tagihan Pemasok"]}
        action={<ExportButton type="supplier-invoices" />}
      />

      <InvoiceForm
        kind="supplier"
        parties={vendors.map((v) => ({ id: v.id, name: v.name }))}
        products={products}
        action={createSupplierInvoiceAction}
      />

      <Card padded={false}>
        <CardHeader
          title="Riwayat Tagihan"
          description={`${rows.length} tagihan`}
          icon={Receipt}
        />
        <Table>
          <thead>
            <tr>
              <Th className="w-32">Tanggal</Th>
              <Th className="w-36">No. Tagihan</Th>
              <Th>Pemasok</Th>
              <Th className="w-32">Jatuh Tempo</Th>
              <Th align="center" className="w-28">
                Status
              </Th>
              <Th align="right" className="w-40">
                Total
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <EmptyState
                icon={FileText}
                title="Belum ada tagihan"
                description="Buat tagihan pemasok pertama lewat form di atas."
                colSpan={6}
              />
            )}
            {rows.map((inv) => (
              <tr key={inv.id} className="hover:bg-sap-hover">
                <Td className="text-sap-label">{inv.invoiceDate}</Td>
                <Td>
                  <Link
                    href={`/supplier-invoices/${inv.id}`}
                    className="font-medium text-sap-blue hover:underline"
                  >
                    {inv.invoiceNumber}
                  </Link>
                </Td>
                <Td>{inv.partyName}</Td>
                <Td className="text-sap-label">{inv.dueDate ?? "—"}</Td>
                <Td align="center">
                  <InfoLabel tone={inv.status === "paid" ? "positive" : "critical"}>
                    {inv.status === "paid" ? "Lunas" : "Belum Lunas"}
                  </InfoLabel>
                </Td>
                <Td align="right" className="font-semibold tabular-nums">
                  {formatRupiah(inv.totalAmount)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
