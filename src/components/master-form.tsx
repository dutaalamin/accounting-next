"use client";

import { useActionState } from "react";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import type { MasterState } from "@/app/(app)/master-actions";
import { Card, CardHeader, Button, inputCls, labelCls } from "@/components/ui";

export interface FieldSpec {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "number" | "textarea" | "checkbox";
  required?: boolean;
  defaultValue?: string;
  span?: 2 | 3 | 4 | 5 | 6 | 12; // kolom pada grid 12
}

/**
 * Tailwind memindai kelas secara statis, jadi lebar kolom harus ditulis
 * lengkap (bukan `md:col-span-${span}`) agar ikut ter-compile.
 */
const SPAN_CLASS: Record<number, string> = {
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  12: "md:col-span-12",
};

/**
 * Form master data generik — dipakai halaman Pelanggan, Pemasok, dan Produk.
 * `action` adalah server action bertipe sama.
 */
export function MasterForm({
  title,
  description,
  action,
  fields,
  submitLabel,
}: {
  title: string;
  description: string;
  action: (prev: MasterState, formData: FormData) => Promise<MasterState>;
  fields: FieldSpec[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<MasterState, FormData>(action, {});

  return (
    <Card padded={false}>
      <CardHeader title={title} description={description} icon={Plus} />
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
          {fields.map((f) => {
            const spanCls = SPAN_CLASS[f.span ?? 4];
            if (f.type === "checkbox") {
              return (
                <div key={f.name} className={`${spanCls} flex items-center gap-2 pt-6`}>
                  <input
                    id={f.name}
                    name={f.name}
                    type="checkbox"
                    defaultChecked={f.defaultValue === "true"}
                    className="h-4 w-4 rounded border-sap-border text-sap-blue focus:ring-sap-blue"
                  />
                  <label htmlFor={f.name} className="text-xs font-medium text-sap-label">
                    {f.label}
                  </label>
                </div>
              );
            }
            return (
              <div key={f.name} className={spanCls}>
                <label htmlFor={f.name} className={labelCls}>
                  {f.label}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    id={f.name}
                    name={f.name}
                    rows={2}
                    placeholder={f.placeholder}
                    className={`${inputCls} h-auto py-2`}
                  />
                ) : (
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type ?? "text"}
                    required={f.required}
                    placeholder={f.placeholder}
                    defaultValue={f.defaultValue}
                    step={f.type === "number" ? "0.01" : undefined}
                    className={inputCls}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          <Button type="submit" variant="emphasized" icon={Plus} disabled={pending}>
            {pending ? "Menyimpan…" : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
