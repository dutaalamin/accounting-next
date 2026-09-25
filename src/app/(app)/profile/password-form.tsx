"use client";

import { useActionState } from "react";
import { KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { changeOwnPassword, type UserState } from "@/app/(app)/users/actions";
import { Button, inputCls, labelCls } from "@/components/ui";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<UserState, FormData>(
    changeOwnPassword,
    {},
  );

  return (
    <form action={formAction}>
      {state.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-sap-negative/30 bg-sap-negative-bg px-3.5 py-2.5 text-[13px] text-sap-negative">
          <AlertCircle size={15} />
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-sap-positive/30 bg-sap-positive-bg px-3.5 py-2.5 text-[13px] text-sap-positive">
          <CheckCircle2 size={15} />
          {state.success}
        </div>
      )}

      <div className="grid max-w-xl grid-cols-1 gap-4">
        <div>
          <label htmlFor="current" className={labelCls}>
            Password Saat Ini
          </label>
          <input
            id="current"
            name="current"
            type="password"
            required
            className={inputCls}
            autoComplete="current-password"
          />
        </div>
        <div>
          <label htmlFor="next" className={labelCls}>
            Password Baru
          </label>
          <input
            id="next"
            name="next"
            type="password"
            required
            className={inputCls}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="confirm" className={labelCls}>
            Ulangi Password Baru
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            className={inputCls}
            autoComplete="new-password"
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-sap-label">
        Minimal 8 karakter, harus mengandung huruf dan angka.
      </p>

      <div className="mt-5">
        <Button type="submit" variant="emphasized" icon={KeyRound} disabled={pending}>
          {pending ? "Menyimpan…" : "Ganti Password"}
        </Button>
      </div>
    </form>
  );
}
