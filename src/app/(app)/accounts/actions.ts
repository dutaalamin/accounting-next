"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, journalEntryLines } from "@/db/schema";
import { requireUser, requireAdmin } from "@/lib/auth";
import { round2 } from "@/lib/accounting/balance";

export interface AccountState {
  error?: string;
  success?: string;
}

const VALID_TYPES = ["asset", "liability", "equity", "revenue", "expense"];

export async function createAccount(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  await requireUser();

  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const initialBalance = round2(Number(formData.get("initialBalance") ?? 0));

  if (!code) return { error: "Kode akun wajib diisi." };
  if (!name) return { error: "Nama akun wajib diisi." };
  if (!VALID_TYPES.includes(type)) return { error: "Tipe akun tidak valid." };
  if (!Number.isFinite(initialBalance)) return { error: "Saldo awal tidak valid." };

  const existing = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.code, code))
    .limit(1);
  if (existing.length > 0) {
    return { error: `Kode akun "${code}" sudah dipakai.` };
  }

  await db.insert(accounts).values({ code, name, type, initialBalance: String(initialBalance) });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: `Akun ${code} — ${name} berhasil dibuat.` };
}

export async function updateAccount(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  await requireUser();

  const id = Number(formData.get("id"));
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const initialBalance = round2(Number(formData.get("initialBalance") ?? 0));

  if (!id) return { error: "ID akun tidak valid." };
  if (!code) return { error: "Kode akun wajib diisi." };
  if (!name) return { error: "Nama akun wajib diisi." };
  if (!VALID_TYPES.includes(type)) return { error: "Tipe akun tidak valid." };

  const dup = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.code, code), sql`${accounts.id} <> ${id}`))
    .limit(1);
  if (dup.length > 0) {
    return { error: `Kode akun "${code}" sudah dipakai akun lain.` };
  }

  await db
    .update(accounts)
    .set({ code, name, type, initialBalance: String(initialBalance), updatedAt: new Date() })
    .where(eq(accounts.id, id));

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: "Akun berhasil diperbarui." };
}

/**
 * Soft-delete akun. Ditolak bila akun masih dipakai di baris jurnal —
 * menghapusnya akan merusak laporan (baris jurnal jadi menggantung).
 */
export async function deleteAccount(id: number): Promise<AccountState> {
  // Menghapus akun mengubah laporan keuangan -> hanya admin.
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Akses ditolak." };
  }

  const used = await db
    .select({ n: sql<string>`count(*)` })
    .from(journalEntryLines)
    .where(eq(journalEntryLines.accountId, id));
  if (Number(used[0]?.n ?? 0) > 0) {
    return {
      error:
        "Akun ini sudah dipakai di jurnal dan tidak bisa dihapus. Buat akun baru bila perlu koreksi.",
    };
  }

  await db
    .update(accounts)
    .set({ deletedAt: new Date() })
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)));

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: "Akun berhasil dihapus." };
}
