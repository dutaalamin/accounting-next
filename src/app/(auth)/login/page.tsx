import { redirect } from "next/navigation";
import { ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const features = [
    { icon: Zap, text: "Catat transaksi dalam hitungan detik" },
    { icon: BarChart3, text: "4 laporan keuangan otomatis" },
    { icon: ShieldCheck, text: "Jurnal terkunci & selalu balance" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Panel kiri — shell SAP */}
      <div className="relative hidden w-1/2 overflow-hidden bg-sap-shell lg:flex">
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-white/15 text-sm font-bold text-white">
              A
            </span>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-white">Accounting</p>
              <p className="text-[11px] text-white/50">Financial Suite</p>
            </div>
          </div>

          <div>
            <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
              Kelola keuangan bisnis tanpa ribet.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              Pencatatan double-entry, jurnal otomatis, dan laporan keuangan yang selalu
              seimbang.
            </p>

            <ul className="mt-8 space-y-3">
              {features.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-white/10">
                    <f.icon size={14} />
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-white/40">© 2026 Accounting · Next.js</p>
        </div>
      </div>

      {/* Panel kanan — form */}
      <div className="flex w-full items-center justify-center bg-sap-bg px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded bg-sap-shell text-sm font-bold text-white">
              A
            </span>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-sap-text">
            Masuk ke Accounting
          </h2>
          <p className="mt-1 text-sm text-sap-label">Gunakan akun Anda untuk melanjutkan</p>

          <div className="mt-6 rounded-lg border border-sap-border bg-sap-card p-5">
            <LoginForm />
          </div>

          <p className="mt-4 rounded border border-sap-border-light bg-sap-card px-3 py-2 text-center text-xs text-sap-label">
            Demo · <span className="font-medium text-sap-text">admin@admin.com</span> /{" "}
            <span className="font-medium text-sap-text">password</span>
          </p>
        </div>
      </div>
    </div>
  );
}
