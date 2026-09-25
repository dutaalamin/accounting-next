"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser, requireAdmin, hashPassword, verifyPassword } from "@/lib/auth";

export interface UserState {
  error?: string;
  success?: string;
}

const MIN_PASSWORD = 8;

function validatePassword(pw: string): string | null {
  if (pw.length < MIN_PASSWORD) {
    return `Password minimal ${MIN_PASSWORD} karakter.`;
  }
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
    return "Password harus mengandung huruf dan angka.";
  }
  return null;
}

// ============================ Kelola user (admin) ============================

export async function createUser(_prev: UserState, formData: FormData): Promise<UserState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "staff");

  if (!name) return { error: "Nama wajib diisi." };
  if (!email || !email.includes("@")) return { error: "Email tidak valid." };
  if (role !== "admin" && role !== "staff") return { error: "Role tidak valid." };

  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) return { error: `Email "${email}" sudah terdaftar.` };

  await db.insert(users).values({
    name,
    email,
    password: await hashPassword(password),
    role,
  });

  revalidatePath("/users");
  return { success: `User ${email} berhasil dibuat.` };
}

export async function resetUserPassword(
  _prev: UserState,
  formData: FormData,
): Promise<UserState> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (!id) return { error: "User tidak valid." };

  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };

  await db
    .update(users)
    .set({ password: await hashPassword(password), updatedAt: new Date() })
    .where(eq(users.id, id));

  revalidatePath("/users");
  return { success: "Password berhasil direset." };
}

export async function changeUserRole(_prev: UserState, formData: FormData): Promise<UserState> {
  const me = await requireAdmin();

  const id = Number(formData.get("id"));
  const role = String(formData.get("role") ?? "");
  if (!id) return { error: "User tidak valid." };
  if (role !== "admin" && role !== "staff") return { error: "Role tidak valid." };

  // Cegah admin terakhir menurunkan dirinya sendiri (bisa terkunci dari sistem).
  if (id === me.id && role !== "admin") {
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    if (admins.length <= 1) {
      return { error: "Tidak bisa menurunkan admin terakhir. Angkat admin lain dulu." };
    }
  }

  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  revalidatePath("/users");
  return { success: "Role berhasil diubah." };
}

export async function deleteUser(_prev: UserState, formData: FormData): Promise<UserState> {
  const me = await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) return { error: "User tidak valid." };
  if (id === me.id) return { error: "Tidak bisa menghapus akun sendiri." };

  const target = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (target.length === 0) return { error: "User tidak ditemukan." };

  // Jangan sampai admin terakhir hilang.
  if (target[0].role === "admin") {
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    if (admins.length <= 1) {
      return { error: "Tidak bisa menghapus admin terakhir." };
    }
  }

  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/users");
  return { success: "User berhasil dihapus." };
}

// ============================ Ganti password sendiri ============================

export async function changeOwnPassword(
  _prev: UserState,
  formData: FormData,
): Promise<UserState> {
  const me = await requireUser();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current) return { error: "Password saat ini wajib diisi." };
  if (next !== confirm) return { error: "Konfirmasi password tidak cocok." };

  const pwError = validatePassword(next);
  if (pwError) return { error: pwError };
  if (next === current) return { error: "Password baru harus berbeda dari yang sekarang." };

  const [user] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!user) return { error: "User tidak ditemukan." };

  const ok = await verifyPassword(current, user.password);
  if (!ok) return { error: "Password saat ini salah." };

  await db
    .update(users)
    .set({ password: await hashPassword(next), updatedAt: new Date() })
    .where(eq(users.id, me.id));

  revalidatePath("/profile");
  return { success: "Password berhasil diubah." };
}
