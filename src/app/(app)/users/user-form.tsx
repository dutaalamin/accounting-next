"use client";

import { useActionState } from "react";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { createUser, type UserState } from "./actions";
import { Card, CardHeader, Button, inputCls, labelCls } from "@/components/ui";

export function UserForm() {
  const [state, formAction, pending] = useActionState<UserState, FormData>(createUser, {});

  return (
    <Card padded={false}>
      <CardHeader
        title="Tambah Pengguna"
        description="Buat akun untuk staf atau admin lain"
        icon={UserPlus}
      />
      <form action={formAction} className="p-5">
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <label htmlFor="name" className={labelCls}>
              Nama
            </label>
            <input id="name" name="name" required placeholder="Budi Santoso" className={inputCls} />
          </div>
          <div className="md:col-span-4">
            <label htmlFor="email" className={labelCls}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="budi@perusahaan.com"
              className={inputCls}
            />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="password" className={labelCls}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="min. 8 karakter"
              className={inputCls}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="role" className={labelCls}>
              Peran
            </label>
            <select id="role" name="role" defaultValue="staff" className={inputCls}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <p className="mt-3 text-xs text-sap-label">
          Password minimal 8 karakter dan harus mengandung huruf dan angka.
        </p>

        <div className="mt-4">
          <Button type="submit" variant="emphasized" icon={UserPlus} disabled={pending}>
            {pending ? "Menyimpan…" : "Tambah Pengguna"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
