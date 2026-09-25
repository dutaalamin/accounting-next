"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { login, type LoginState } from "./actions";

const inputCls =
  "h-11 w-full rounded-xl border border-sap-border bg-white pl-10 pr-3 text-sm text-sap-text outline-none transition placeholder:text-sap-label focus:border-sap-blue focus:ring-4 focus:ring-sap-blue-light";
const labelCls = "mb-1.5 block text-xs font-medium text-sap-label";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-sap-negative/30 bg-sap-negative-bg px-3.5 py-2.5 text-[13px] text-sap-negative"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className={labelCls}>
          Email
        </label>
        <div className="relative">
          <Mail
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sap-label"
          />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="username"
            placeholder="nama@perusahaan.com"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className={labelCls}>
          Password
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sap-label"
          />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Masukkan password"
            className={`${inputCls} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-sap-label transition hover:bg-sap-hover hover:text-sap-text"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sap-blue text-sm font-semibold text-white shadow-sm shadow-sap-blue/25 transition hover:bg-sap-blue-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Memproses…
          </>
        ) : (
          "Masuk"
        )}
      </button>
    </form>
  );
}
