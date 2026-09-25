import { Truck } from "lucide-react";
import { getVendors } from "@/lib/queries";
import { PageHeader, Card, CardHeader, Table, Th, Td, EmptyState } from "@/components/ui";
import { MasterForm } from "@/components/master-form";
import { createVendor } from "@/app/(app)/master-actions";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const rows = await getVendors();

  return (
    <>
      <PageHeader
        title="Pemasok"
        subtitle={`${rows.length} pemasok terdaftar`}
        breadcrumb={["Home", "Master Data", "Pemasok"]}
      />

      <MasterForm
        title="Tambah Pemasok"
        description="Data pemasok untuk pembelian / tagihan masuk"
        action={createVendor}
        submitLabel="Tambah Pemasok"
        fields={[
          { name: "name", label: "Nama", placeholder: "CV Sumber Material", required: true, span: 4 },
          { name: "email", label: "Email", placeholder: "sales@sumber.com", type: "email", span: 4 },
          { name: "phone", label: "Telepon", placeholder: "0813xxxxxxx", span: 4 },
          { name: "address", label: "Alamat", placeholder: "Jl. Industri No. 5, Bekasi", type: "textarea", span: 12 },
        ]}
      />

      <Card padded={false}>
        <CardHeader title="Daftar Pemasok" description="Data pemasok aktif" icon={Truck} />
        <Table>
          <thead>
            <tr>
              <Th>Nama</Th>
              <Th>Email</Th>
              <Th>Telepon</Th>
              <Th>Alamat</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <EmptyState
                icon={Truck}
                title="Belum ada pemasok"
                description="Tambahkan pemasok pertama lewat form di atas."
                colSpan={4}
              />
            )}
            {rows.map((v) => (
              <tr key={v.id} className="hover:bg-sap-hover">
                <Td className="font-medium">{v.name}</Td>
                <Td className="text-sap-label">{v.email ?? "—"}</Td>
                <Td className="text-sap-label">{v.phone ?? "—"}</Td>
                <Td className="text-sap-label">{v.address ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
