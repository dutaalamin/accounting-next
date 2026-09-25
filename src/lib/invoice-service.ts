/**
 * Layanan invoice (server-side).
 *
 * Semua operasi tulis berjalan dalam SATU transaksi database supaya tidak
 * ada data setengah jadi: invoice + baris + mutasi stok + jurnal semuanya
 * berhasil bersama atau gagal bersama.
 */

import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  customerInvoiceLines,
  customerInvoices,
  customers,
  journalEntries,
  journalEntryLines,
  products,
  supplierInvoiceLines,
  supplierInvoices,
  vendors,
} from "@/db/schema";
import {
  computeInvoiceTotals,
  buildCustomerInvoiceJournal,
  buildSupplierInvoiceJournal,
  validateInvoice,
  validateStock,
  type InvoiceLineInput,
  type PostingAccounts,
} from "./accounting/invoice";
import { isBalanced, round2 } from "./accounting/balance";

export class InvoiceServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceServiceError";
  }
}

/** Ambil akun default untuk posting jurnal (berdasarkan kode COA). */
async function resolvePostingAccounts(): Promise<PostingAccounts> {
  const rows = await db
    .select({ id: accounts.id, code: accounts.code, type: accounts.type, name: accounts.name })
    .from(accounts)
    .where(isNull(accounts.deletedAt));

  const byCode = (code: string) => rows.find((r) => r.code === code);
  const byType = (type: string) => rows.find((r) => r.type === type);

  const cash = byCode("111") ?? byCode("112") ?? byType("asset");
  const ar = byCode("113") ?? byType("asset");
  const ap = byCode("211") ?? byType("liability");
  const revenue = byCode("411") ?? byCode("412") ?? byType("revenue");
  const expense = byCode("511") ?? byCode("512") ?? byType("expense");
  const outputTax =
    byCode("212") ?? rows.find((r) => r.type === "liability" && r.name.includes("PPN")) ?? ap;
  const inputTax =
    byCode("115") ?? rows.find((r) => r.type === "asset" && r.name.includes("PPN")) ?? cash;

  if (!cash || !ar || !ap || !revenue || !expense || !outputTax || !inputTax) {
    throw new InvoiceServiceError(
      "Akun default belum lengkap. Pastikan COA punya akun kas, piutang, utang, pendapatan, dan beban.",
    );
  }

  return {
    cash: cash.id,
    ar: ar.id,
    ap: ap.id,
    revenue: revenue.id,
    expense: expense.id,
    outputTax: outputTax.id,
    inputTax: inputTax.id,
  };
}

interface InvoiceInput {
  partyId: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  taxPercentage: number;
  status: "unpaid" | "paid";
  notes?: string | null;
  lines: InvoiceLineInput[];
}

/**
 * Buat invoice pelanggan: simpan, kurangi stok, posting jurnal — satu transaksi.
 */
export async function createCustomerInvoice(input: InvoiceInput): Promise<number> {
  validateInvoice({
    invoiceNumber: input.invoiceNumber,
    invoiceDate: input.invoiceDate,
    taxPercentage: input.taxPercentage,
    lines: input.lines,
  });

  const { total } = computeInvoiceTotals(input.lines, input.taxPercentage);

  return db.transaction(async (tx) => {
    // Nomor invoice harus unik.
    const dup = await tx
      .select({ id: customerInvoices.id })
      .from(customerInvoices)
      .where(eq(customerInvoices.invoiceNumber, input.invoiceNumber.trim()))
      .limit(1);
    if (dup.length > 0) {
      throw new InvoiceServiceError(`Nomor invoice "${input.invoiceNumber}" sudah dipakai.`);
    }

    const [customer] = await tx
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(and(eq(customers.id, input.partyId), isNull(customers.deletedAt)))
      .limit(1);
    if (!customer) throw new InvoiceServiceError("Pelanggan tidak ditemukan.");

    // Cek stok & kunci baris produk (FOR UPDATE) supaya dua invoice bersamaan
    // tidak bisa sama-sama lolos lalu membuat stok minus.
    for (const line of input.lines) {
      if (!line.productId) continue;
      const locked = await tx.execute(
        sql`SELECT id, name, stock, track_stock FROM products WHERE id = ${line.productId} FOR UPDATE`,
      );
      const p = (locked.rows as { id: number; name: string; stock: number; track_stock: boolean }[])[0];
      if (!p) continue;
      validateStock(
        [line],
        [{ id: p.id, name: p.name, stock: Number(p.stock), trackStock: p.track_stock }],
      );
    }

    const [invoice] = await tx
      .insert(customerInvoices)
      .values({
        customerId: input.partyId,
        invoiceNumber: input.invoiceNumber.trim(),
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate || null,
        taxPercentage: String(round2(input.taxPercentage)),
        taxAmount: String(computeInvoiceTotals(input.lines, input.taxPercentage).taxAmount),
        totalAmount: String(total),
        status: input.status,
        notes: input.notes?.trim() || null,
      })
      .returning({ id: customerInvoices.id });

    for (const line of input.lines) {
      const sub = round2(line.quantity * line.unitPrice);
      await tx.insert(customerInvoiceLines).values({
        customerInvoiceId: invoice.id,
        productId: line.productId ?? null,
        description: line.description?.trim() || null,
        quantity: line.quantity,
        unitPrice: String(round2(line.unitPrice)),
        subtotal: String(sub),
      });

      // Kurangi stok hanya untuk produk fisik.
      if (line.productId) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${line.quantity}` })
          .where(and(eq(products.id, line.productId), eq(products.trackStock, true)));
      }
    }

    // Posting jurnal.
    const acc = await resolvePostingAccounts();
    const journalLines = buildCustomerInvoiceJournal(
      {
        invoiceNumber: input.invoiceNumber,
        status: input.status,
        taxPercentage: input.taxPercentage,
        lines: input.lines,
        partyName: customer.name,
      },
      acc,
    );

    const debit = round2(journalLines.reduce((s, l) => s + l.debit, 0));
    const credit = round2(journalLines.reduce((s, l) => s + l.credit, 0));
    if (!isBalanced(debit, credit)) {
      throw new InvoiceServiceError("Jurnal tidak balance — invoice dibatalkan.");
    }

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        referenceNumber: `INV-CUST-${input.invoiceNumber}`,
        date: input.invoiceDate,
        description: `Penjualan ke ${customer.name} (${input.invoiceNumber})`,
        sourceType: "customer_invoice",
        sourceId: invoice.id,
        isPosted: true,
        postedAt: new Date(),
      })
      .returning({ id: journalEntries.id });

    await tx.insert(journalEntryLines).values(
      journalLines.map((l) => ({
        journalEntryId: entry.id,
        accountId: l.accountId,
        debit: String(l.debit),
        credit: String(l.credit),
        description: l.description,
      })),
    );

    return invoice.id;
  });
}

/**
 * Buat invoice pemasok: simpan + posting jurnal — satu transaksi.
 * Pembelian TIDAK mengubah stok (stok bertambah lewat penjualan/penerimaan).
 */
export async function createSupplierInvoice(input: InvoiceInput): Promise<number> {
  validateInvoice({
    invoiceNumber: input.invoiceNumber,
    invoiceDate: input.invoiceDate,
    taxPercentage: input.taxPercentage,
    lines: input.lines,
  });

  const totals = computeInvoiceTotals(input.lines, input.taxPercentage);

  return db.transaction(async (tx) => {
    const dup = await tx
      .select({ id: supplierInvoices.id })
      .from(supplierInvoices)
      .where(eq(supplierInvoices.invoiceNumber, input.invoiceNumber.trim()))
      .limit(1);
    if (dup.length > 0) {
      throw new InvoiceServiceError(`Nomor invoice "${input.invoiceNumber}" sudah dipakai.`);
    }

    const [vendor] = await tx
      .select({ id: vendors.id, name: vendors.name })
      .from(vendors)
      .where(and(eq(vendors.id, input.partyId), isNull(vendors.deletedAt)))
      .limit(1);
    if (!vendor) throw new InvoiceServiceError("Pemasok tidak ditemukan.");

    const [invoice] = await tx
      .insert(supplierInvoices)
      .values({
        vendorId: input.partyId,
        invoiceNumber: input.invoiceNumber.trim(),
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate || null,
        taxPercentage: String(round2(input.taxPercentage)),
        taxAmount: String(totals.taxAmount),
        totalAmount: String(totals.total),
        status: input.status,
        notes: input.notes?.trim() || null,
      })
      .returning({ id: supplierInvoices.id });

    for (const line of input.lines) {
      await tx.insert(supplierInvoiceLines).values({
        supplierInvoiceId: invoice.id,
        productId: line.productId ?? null,
        description: line.description?.trim() || null,
        quantity: line.quantity,
        unitPrice: String(round2(line.unitPrice)),
        subtotal: String(round2(line.quantity * line.unitPrice)),
      });
    }

    const acc = await resolvePostingAccounts();
    const journalLines = buildSupplierInvoiceJournal(
      {
        invoiceNumber: input.invoiceNumber,
        status: input.status,
        taxPercentage: input.taxPercentage,
        lines: input.lines,
        partyName: vendor.name,
      },
      acc,
    );

    const debit = round2(journalLines.reduce((s, l) => s + l.debit, 0));
    const credit = round2(journalLines.reduce((s, l) => s + l.credit, 0));
    if (!isBalanced(debit, credit)) {
      throw new InvoiceServiceError("Jurnal tidak balance — invoice dibatalkan.");
    }

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        referenceNumber: `INV-SUPP-${input.invoiceNumber}`,
        date: input.invoiceDate,
        description: `Pembelian dari ${vendor.name} (${input.invoiceNumber})`,
        sourceType: "supplier_invoice",
        sourceId: invoice.id,
        isPosted: true,
        postedAt: new Date(),
      })
      .returning({ id: journalEntries.id });

    await tx.insert(journalEntryLines).values(
      journalLines.map((l) => ({
        journalEntryId: entry.id,
        accountId: l.accountId,
        debit: String(l.debit),
        credit: String(l.credit),
        description: l.description,
      })),
    );

    return invoice.id;
  });
}
