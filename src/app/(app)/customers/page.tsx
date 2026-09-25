import { Users } from "lucide-react";
import { getCustomers } from "@/lib/queries";
import { PageHeader, Card, CardHeader, Table, Th, Td, EmptyState } from "@/components/ui";
import { MasterForm } from "@/components/master-form";
import { createCustomer } from "@/app/(app)/master-actions";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const rows = await getCustomers();

  return (
    <>
      <PageHeader
        title="Pelanggan"
        subtitle={`${rows.length} pelanggan terdaftar`}
        breadcrumb={["Home", "Master Data", "Pelanggan"]}
      />

      <MasterForm
        title="Tambah Pelanggan"
        description="Data pelanggan untuk pembuatan invoice"
        action={createCustomer}
        submitLabel="Tambah Pelanggan"
        fields={[
          { name: "name", label: "Nama", placeholder: "PT Maju Jaya", required: true, span: 4 },
          { name: "email", label: "Email", placeholder: "budi@majujaya.com", type: "email", span: 4 },
          { name: "phone", label: "Telepon", placeholder: "0812xxxxxxx", span: 4 },
          { name: "address", label: "Alamat", placeholder: "Jl. Contoh No. 1, Jakarta", type: "textarea", span: 12 },
        ]}
      />

      <Card padded={false}>
        <CardHeader title="Daftar Pelanggan" description="Data pelanggan aktif" icon={Users} />
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
                icon={Users}
                title="Belum ada pelanggan"
                description="Tambahkan pelanggan pertama lewat form di atas."
                colSpan={4}
              />
            )}
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-sap-hover">
                <Td className="font-medium">{c.name}</Td>
                <Td className="text-sap-label">{c.email ?? "—"}</Td>
                <Td className="text-sap-label">{c.phone ?? "—"}</Td>
                <Td className="text-sap-label">{c.address ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
