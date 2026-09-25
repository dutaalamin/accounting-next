import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-sap-bg px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-sm">
            A
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-sap-text">
            Masuk ke Accounting
          </h1>
          <p className="mt-1 text-sm text-sap-label">Gunakan akun Anda untuk melanjutkan</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-sap-border bg-sap-card p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-sap-label">
          © 2026 Accounting
        </p>
      </div>
    </div>
  );
}
