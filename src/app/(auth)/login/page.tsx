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
    { icon: ShieldCheck, text: "Jurnal terkunci & balance" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Panel kiri — brand */}
      <div className="relative hidden w-1/2 overflow-hidden bg-[#0a0b0e] lg:flex">
        <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-violet-600/20 blur-[120px]" />

        <div className="relative z-10 flex flex-col justify-between p-14">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
              A
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Accounting</p>
              <p className="text-[11px] text-slate-500">Financial Suite</p>
            </div>
          </div>

          <div>
            <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
              Kelola keuangan bisnis tanpa ribet.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Pencatatan double-entry, jurnal otomatis, dan laporan keuangan yang selalu
              seimbang.
            </p>

            <ul className="mt-8 space-y-3">
              {features.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-indigo-400">
                    <f.icon size={15} />
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-[#4b515b]">© 2026 Accounting · Next.js</p>
        </div>
      </div>

      {/* Panel kanan — form */}
      <div className="flex w-full items-center justify-center bg-slate-50 px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
              A
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Selamat datang kembali
          </h2>
          <p className="mt-1 text-sm text-slate-500">Masuk untuk melanjutkan ke dashboard</p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">
            Demo · <span className="font-medium text-slate-700">admin@admin.com</span> /{" "}
            <span className="font-medium text-slate-700">password</span>
          </p>
        </div>
      </div>
    </div>
  );
}
