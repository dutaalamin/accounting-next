"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth";
import {
  deleteCustomerInvoice,
  deleteSupplierInvoice,
  CorrectionError,
} from "@/lib/correction-service";
import {
  createCustomerInvoice,
  createSupplierInvoice,
  InvoiceServiceError,
} from "@/lib/invoice-service";
import { InvoiceValidationError, type InvoiceLineInput } from "@/lib/accounting/invoice";

export interface InvoiceState {
  error?: string;
  success?: string;
}

interface RawLine {
  productId?: number | string | null;
  description?: string;
  quantity?: number | string;
  unitPrice?: number | string;
}

interface RawPayload {
  partyId?: number | string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  taxPercentage?: number | string;
  status?: string;
  notes?: string;
  lines?: RawLine[];
}

function parse(formData: FormData):
  | { ok: true; data: {
      partyId: number;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string | null;
      taxPercentage: number;
      status: "unpaid" | "paid";
      notes: string | null;
      lines: InvoiceLineInput[];
    } }
  | { ok: false; error: string } {
  let payload: RawPayload;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { ok: false, error: "Data invoice tidak valid." };
  }

  const partyId = Number(payload.partyId);
  if (!partyId) return { ok: false, error: "Pilih pelanggan / pemasok terlebih dahulu." };

  // Buang baris kosong.
  const lines: InvoiceLineInput[] = (payload.lines ?? [])
    .filter((l) => l.productId || Number(l.quantity) || Number(l.unitPrice) || l.description)
    .map((l) => ({
      productId: l.productId ? Number(l.productId) : null,
      description: l.description ?? null,
      quantity: Math.trunc(Number(l.quantity) || 0),
      unitPrice: Number(l.unitPrice) || 0,
    }));

  const status = payload.status === "paid" ? "paid" : "unpaid";

  return {
    ok: true,
    data: {
      partyId,
      invoiceNumber: String(payload.invoiceNumber ?? "").trim(),
      invoiceDate: String(payload.invoiceDate ?? ""),
      dueDate: payload.dueDate ? String(payload.dueDate) : null,
      taxPercentage: Number(payload.taxPercentage) || 0,
      status,
      notes: payload.notes?.trim() || null,
      lines,
    },
  };
}

function toMessage(e: unknown): string {
  if (e instanceof InvoiceValidationError || e instanceof InvoiceServiceError) return e.message;
  if (e instanceof Error) return e.message;
  return "Terjadi kesalahan tak terduga.";
}

export async function createCustomerInvoiceAction(
  _prev: InvoiceState,
  formData: FormData,
): Promise<InvoiceState> {
  await requireUser();
  const parsed = parse(formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    await createCustomerInvoice(parsed.data);
  } catch (e) {
    return { error: toMessage(e) };
  }

  revalidatePath("/customer-invoices");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/products");
  revalidatePath("/journals");
  return { success: `Invoice ${parsed.data.invoiceNumber} berhasil dibuat & jurnal ter-posting.` };
}

export async function createSupplierInvoiceAction(
  _prev: InvoiceState,
  formData: FormData,
): Promise<InvoiceState> {
  await requireUser();
  const parsed = parse(formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    await createSupplierInvoice(parsed.data);
  } catch (e) {
    return { error: toMessage(e) };
  }

  revalidatePath("/supplier-invoices");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/journals");
  return { success: `Tagihan ${parsed.data.invoiceNumber} berhasil dibuat & jurnal ter-posting.` };
}

// ============================ Pembatalan (koreksi) ============================

export interface CancelState {
  error?: string;
  success?: string;
}

/**
 * Batalkan invoice pelanggan.
 * Hanya admin. Jurnal tidak dihapus — dibuat jurnal pembalik (jejak audit).
 */
export async function cancelCustomerInvoice(
  _prev: CancelState,
  formData: FormData,
): Promise<CancelState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Akses ditolak." };
  }

  const id = Number(formData.get("id"));
  if (!id) return { error: "Invoice tidak valid." };

  try {
    await deleteCustomerInvoice(id);
  } catch (e) {
    if (e instanceof CorrectionError) return { error: e.message };
    return { error: e instanceof Error ? e.message : "Gagal membatalkan invoice." };
  }

  revalidatePath("/customer-invoices");
  revalidatePath("/journals");
  revalidatePath("/accounts");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { success: "Invoice dibatalkan. Jurnal pembalik sudah dibuat & stok dikembalikan." };
}

export async function cancelSupplierInvoice(
  _prev: CancelState,
  formData: FormData,
): Promise<CancelState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Akses ditolak." };
  }

  const id = Number(formData.get("id"));
  if (!id) return { error: "Tagihan tidak valid." };

  try {
    await deleteSupplierInvoice(id);
  } catch (e) {
    if (e instanceof CorrectionError) return { error: e.message };
    return { error: e instanceof Error ? e.message : "Gagal membatalkan tagihan." };
  }

  revalidatePath("/supplier-invoices");
  revalidatePath("/journals");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: "Tagihan dibatalkan. Jurnal pembalik sudah dibuat." };
}
