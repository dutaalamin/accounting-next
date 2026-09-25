import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sap-bg px-6">
      {/* Aksen latar */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-sap-blue/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-violet-500/10 blur-[100px]" />

      <div className="relative w-full max-w-[400px]">
        {/* Logo & judul */}
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/25">
            A
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-sap-text">
            Masuk ke Accounting
          </h1>
          <p className="mt-1.5 text-sm text-sap-label">
            Gunakan akun Anda untuk melanjutkan
          </p>
        </div>

        {/* Kartu form */}
        <div className="rounded-2xl border border-sap-border bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.18)]">
          <LoginForm />
        </div>

        {/* Catatan keamanan */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-sap-label">
          <ShieldCheck size={13} />
          <span>Koneksi terenkripsi · Data keuangan Anda aman</span>
        </div>

        <p className="mt-6 text-center text-xs text-sap-label">© 2026 Accounting</p>
      </div>
    </div>
  );
}
