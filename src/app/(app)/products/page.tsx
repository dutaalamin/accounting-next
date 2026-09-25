import { Package } from "lucide-react";
import { getProducts } from "@/lib/queries";
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
  EmptyState,
} from "@/components/ui";
import { MasterForm } from "@/components/master-form";
import { createProduct } from "@/app/(app)/master-actions";
import { ExportButton } from "@/components/export-button";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const rows = await getProducts();

  return (
    <>
      <PageHeader
        title="Produk & Layanan"
        subtitle={`${rows.length} item terdaftar`}
        breadcrumb={["Home", "Master Data", "Produk"]}
        action={<ExportButton type="products" />}
      />

      <MasterForm
        title="Tambah Produk / Layanan"
        description="Barang atau jasa yang dijual / dibeli"
        action={createProduct}
        submitLabel="Tambah Produk"
        fields={[
          { name: "sku", label: "SKU", placeholder: "BRG-001", span: 3 },
          { name: "name", label: "Nama", placeholder: "Semen 40kg", required: true, span: 5 },
          { name: "price", label: "Harga Jual", placeholder: "0", type: "number", span: 4 },
          { name: "stock", label: "Stok Awal", placeholder: "0", type: "number", span: 4 },
          {
            name: "trackStock",
            label: "Lacak stok (barang fisik)",
            type: "checkbox",
            defaultValue: "true",
            span: 4,
          },
          { name: "description", label: "Deskripsi", placeholder: "Keterangan opsional", type: "textarea", span: 12 },
        ]}
      />

      <Card padded={false}>
        <CardHeader title="Daftar Produk" description="Barang & jasa" icon={Package} />
        <Table>
          <thead>
            <tr>
              <Th className="w-28">SKU</Th>
              <Th>Nama</Th>
              <Th align="right" className="w-40">
                Harga
              </Th>
              <Th align="center" className="w-28">
                Stok
              </Th>
              <Th className="w-28">Tipe</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <EmptyState
                icon={Package}
                title="Belum ada produk"
                description="Tambahkan produk atau jasa lewat form di atas."
                colSpan={5}
              />
            )}
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-sap-hover">
                <Td>{p.sku ? <Code>{p.sku}</Code> : <span className="text-sap-border">—</span>}</Td>
                <Td className="font-medium">{p.name}</Td>
                <Td align="right" className="tabular-nums">
                  {formatRupiah(p.price)}
                </Td>
                <Td
                  align="center"
                  className={`tabular-nums ${p.trackStock && p.stock <= 0 ? "text-sap-negative" : ""}`}
                >
                  {p.trackStock ? p.stock : "—"}
                </Td>
                <Td>
                  <InfoLabel tone={p.trackStock ? "blue" : "neutral"}>
                    {p.trackStock ? "Barang" : "Jasa"}
                  </InfoLabel>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
