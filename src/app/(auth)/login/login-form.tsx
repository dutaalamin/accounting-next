"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { login, type LoginState } from "./actions";

const inputCls =
  "h-9 w-full rounded border border-[#89919a] bg-white px-2.5 text-[13px] text-sap-text outline-none transition placeholder:text-sap-label focus:border-sap-blue focus:ring-1 focus:ring-sap-blue";
const labelCls = "mb-1 block text-xs font-medium text-sap-label";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="flex items-center gap-2 rounded border border-sap-negative/30 bg-sap-negative-bg px-3 py-2 text-[13px] text-sap-negative">
          <AlertCircle size={15} />
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className={labelCls}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          defaultValue="admin@admin.com"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelCls}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          defaultValue="password"
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-9 w-full rounded bg-sap-blue text-[13px] font-medium text-white transition-colors hover:bg-sap-blue-dark disabled:opacity-60"
      >
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
