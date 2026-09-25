import { UserCog } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader, Card, CardHeader, InfoLabel } from "@/components/ui";
import { PasswordForm } from "./password-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const me = await requireUser();

  return (
    <>
      <PageHeader
        title="Profil Saya"
        subtitle="Kelola akun dan keamanan Anda"
        breadcrumb={["Home", "Pengaturan", "Profil"]}
      />

      <Card>
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 text-lg font-bold text-white">
            {me.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-base font-semibold text-sap-text">{me.name}</p>
            <p className="text-sm text-sap-label">{me.email}</p>
            <div className="mt-1">
              <InfoLabel tone={me.role === "admin" ? "blue" : "neutral"}>
                {me.role === "admin" ? "Admin" : "Staff"}
              </InfoLabel>
            </div>
          </div>
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader
          title="Ganti Password"
          description="Demi keamanan, jangan bagikan password Anda ke siapa pun"
          icon={UserCog}
        />
        <div className="p-5">
          <PasswordForm />
        </div>
      </Card>
    </>
  );
}
