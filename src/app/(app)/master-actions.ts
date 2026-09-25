"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { customers, products, vendors } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { round2 } from "@/lib/accounting/balance";

export interface MasterState {
  error?: string;
  success?: string;
}

// ============================ Pelanggan ============================

export async function createCustomer(
  _prev: MasterState,
  formData: FormData,
): Promise<MasterState> {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama pelanggan wajib diisi." };

  await db.insert(customers).values({
    name,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
  });

  revalidatePath("/customers");
  return { success: `Pelanggan "${name}" berhasil ditambahkan.` };
}

export async function deleteCustomer(id: number): Promise<MasterState> {
  await requireUser();
  await db.update(customers).set({ deletedAt: new Date() }).where(eq(customers.id, id));
  revalidatePath("/customers");
  return { success: "Pelanggan dihapus." };
}

// ============================ Pemasok ============================

export async function createVendor(
  _prev: MasterState,
  formData: FormData,
): Promise<MasterState> {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nama pemasok wajib diisi." };

  await db.insert(vendors).values({
    name,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
  });

  revalidatePath("/vendors");
  return { success: `Pemasok "${name}" berhasil ditambahkan.` };
}

export async function deleteVendor(id: number): Promise<MasterState> {
  await requireUser();
  await db.update(vendors).set({ deletedAt: new Date() }).where(eq(vendors.id, id));
  revalidatePath("/vendors");
  return { success: "Pemasok dihapus." };
}

// ============================ Produk ============================

export async function createProduct(
  _prev: MasterState,
  formData: FormData,
): Promise<MasterState> {
  await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const price = round2(Number(formData.get("price") ?? 0));
  const stock = Math.trunc(Number(formData.get("stock") ?? 0));
  const trackStock = formData.get("trackStock") === "on";

  if (!name) return { error: "Nama produk wajib diisi." };
  if (!Number.isFinite(price) || price < 0) return { error: "Harga tidak valid." };
  if (!Number.isFinite(stock) || stock < 0) return { error: "Stok tidak valid." };

  if (sku) {
    const dup = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.sku, sku), isNull(products.deletedAt)))
      .limit(1);
    if (dup.length > 0) return { error: `SKU "${sku}" sudah dipakai.` };
  }

  await db.insert(products).values({
    name,
    sku,
    price: String(price),
    stock,
    trackStock,
    description: String(formData.get("description") ?? "").trim() || null,
  });

  revalidatePath("/products");
  return { success: `Produk "${name}" berhasil ditambahkan.` };
}

export async function deleteProduct(id: number): Promise<MasterState> {
  await requireUser();
  await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, id));
  revalidatePath("/products");
  return { success: "Produk dihapus." };
}
