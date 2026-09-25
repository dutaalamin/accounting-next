import { desc } from "drizzle-orm";
import { Users } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Card, CardHeader, Table, Th, Td, InfoLabel, EmptyState } from "@/components/ui";
import { UserForm } from "./user-form";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requireAdmin();

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.role), users.name);

  return (
    <>
      <PageHeader
        title="Kelola Pengguna"
        subtitle={`${rows.length} pengguna terdaftar`}
        breadcrumb={["Home", "Pengaturan", "Pengguna"]}
      />

      <UserForm />

      <Card padded={false}>
        <CardHeader title="Daftar Pengguna" description="Akun yang bisa mengakses aplikasi" icon={Users} />
        <Table>
          <thead>
            <tr>
              <Th>Nama</Th>
              <Th>Email</Th>
              <Th className="w-28">Peran</Th>
              <Th className="w-32">Dibuat</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <EmptyState icon={Users} title="Belum ada pengguna" colSpan={4} />
            )}
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-sap-hover">
                <Td className="font-medium">
                  {u.name}
                  {u.id === me.id && (
                    <span className="ml-2 text-xs text-sap-label">(Anda)</span>
                  )}
                </Td>
                <Td className="text-sap-label">{u.email}</Td>
                <Td>
                  <InfoLabel tone={u.role === "admin" ? "blue" : "neutral"}>
                    {u.role === "admin" ? "Admin" : "Staff"}
                  </InfoLabel>
                </Td>
                <Td className="text-sap-label">
                  {new Date(u.createdAt).toISOString().slice(0, 10)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <p className="text-xs text-sap-label">
          <strong className="text-sap-text">Catatan:</strong> reset password &amp; ubah peran
          pengguna lain dapat dilakukan lewat perintah berikut (agar tidak ada tombol berbahaya
          yang mudah terklik):
        </p>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-sap-neutral-bg p-3 font-mono text-xs text-sap-label">
{`# Reset password user (ganti <email> & <password-baru>)
npx tsx scripts/manage-user.ts reset <email> <password-baru>

# Ubah peran user
npx tsx scripts/manage-user.ts role <email> admin|staff`}
        </pre>
      </Card>
    </>
  );
}
