import Link from "next/link";
import { FileText, Receipt } from "lucide-react";
import { getCustomerInvoices, getCustomers, getProducts } from "@/lib/queries";
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
import { createCustomerInvoiceAction } from "../invoices/actions";

export const dynamic = "force-dynamic";

export default async function CustomerInvoicesPage() {
  const [rows, customers, products] = await Promise.all([
    getCustomerInvoices(),
    getCustomers(),
    getProducts(),
  ]);

  return (
    <>
      <PageHeader
        title="Tagihan Pelanggan"
        subtitle="Invoice penjualan, jurnal ter-posting otomatis"
        breadcrumb={["Home", "Piutang Usaha", "Tagihan Pelanggan"]}
        action={<ExportButton type="customer-invoices" />}
      />

      <InvoiceForm
        kind="customer"
        parties={customers.map((c) => ({ id: c.id, name: c.name }))}
        products={products}
        action={createCustomerInvoiceAction}
      />

      <Card padded={false}>
        <CardHeader
          title="Riwayat Tagihan"
          description={`${rows.length} invoice`}
          icon={Receipt}
        />
        <Table>
          <thead>
            <tr>
              <Th className="w-32">Tanggal</Th>
              <Th className="w-36">No. Invoice</Th>
              <Th>Pelanggan</Th>
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
                description="Buat invoice pertama lewat form di atas."
                colSpan={6}
              />
            )}
            {rows.map((inv) => (
              <tr key={inv.id} className="hover:bg-sap-hover">
                <Td className="text-sap-label">{inv.invoiceDate}</Td>
                <Td>
                  <Link
                    href={`/customer-invoices/${inv.id}`}
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
