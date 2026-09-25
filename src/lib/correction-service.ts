/**
 * Koreksi data: hapus invoice & jurnal pembalik.
 *
 * Prinsip akuntansi yang dipegang:
 *  - Invoice yang salah boleh dibatalkan, TAPI jurnalnya TIDAK dihapus —
 *    dibuat JURNAL PEMBALIK (debit/kredit ditukar) supaya jejak audit tetap ada.
 *  - Stok dikembalikan bila invoice penjualan dibatalkan.
 *  - Jurnal asli disembunyikan dari laporan (soft delete) agar tidak
 *    terhitung dua kali bersama jurnal pembaliknya.
 */

import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  customerInvoiceLines,
  customerInvoices,
  journalEntries,
  journalEntryLines,
  products,
  supplierInvoices,
} from "@/db/schema";

export class CorrectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CorrectionError";
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function findJournal(tx: Tx, sourceType: string, sourceId: number) {
  const [entry] = await tx
    .select({ id: journalEntries.id, referenceNumber: journalEntries.referenceNumber })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.sourceType, sourceType),
        eq(journalEntries.sourceId, sourceId),
        isNull(journalEntries.deletedAt),
      ),
    )
    .limit(1);
  return entry ?? null;
}

/** Buat jurnal pembalik: tukar debit & kredit dari jurnal asal. */
async function createReversalJournal(
  tx: Tx,
  originalJournalId: number,
  originalRef: string,
  reason: string,
): Promise<void> {
  const originalLines = await tx
    .select({
      accountId: journalEntryLines.accountId,
      debit: journalEntryLines.debit,
      credit: journalEntryLines.credit,
      description: journalEntryLines.description,
    })
    .from(journalEntryLines)
    .where(eq(journalEntryLines.journalEntryId, originalJournalId))
    .orderBy(journalEntryLines.id);

  if (originalLines.length === 0) {
    throw new CorrectionError("Jurnal asal tidak punya baris — tidak bisa dibalik.");
  }

  const [reversal] = await tx
    .insert(journalEntries)
    .values({
      referenceNumber: `REV-${originalRef}`,
      date: new Date().toISOString().slice(0, 10),
      description: reason,
      sourceType: "reversal",
      isPosted: true,
      postedAt: new Date(),
    })
    .returning({ id: journalEntries.id });

  await tx.insert(journalEntryLines).values(
    originalLines.map((l) => ({
      journalEntryId: reversal.id,
      accountId: l.accountId,
      debit: String(l.credit), // ditukar
      credit: String(l.debit),
      description: `Pembalik: ${l.description ?? ""}`.trim(),
    })),
  );

  // PENTING: jurnal asli TIDAK dihapus/disembunyikan.
  // Jurnal asli + jurnal pembalik = saling meniadakan (net nol), dan
  // keduanya tetap terlihat di Buku Besar sebagai jejak audit.
  // Kalau jurnal asli ikut disembunyikan, efeknya jadi pembatalan GANDA
  // dan saldo akun berbalik tanda (mis. Piutang jadi minus).
}

/** Batalkan invoice pelanggan: jurnal pembalik + kembalikan stok + soft delete. */
export async function deleteCustomerInvoice(invoiceId: number): Promise<void> {
  await db.transaction(async (tx) => {
    const [invoice] = await tx
      .select({ id: customerInvoices.id, invoiceNumber: customerInvoices.invoiceNumber })
      .from(customerInvoices)
      .where(and(eq(customerInvoices.id, invoiceId), isNull(customerInvoices.deletedAt)))
      .limit(1);

    if (!invoice) throw new CorrectionError("Invoice tidak ditemukan.");

    const journal = await findJournal(tx, "customer_invoice", invoiceId);
    if (journal) {
      await createReversalJournal(
        tx,
        journal.id,
        journal.referenceNumber,
        `Pembatalan invoice ${invoice.invoiceNumber}`,
      );
    }

    // Kembalikan stok produk fisik.
    const lines = await tx
      .select({
        productId: customerInvoiceLines.productId,
        quantity: customerInvoiceLines.quantity,
      })
      .from(customerInvoiceLines)
      .where(eq(customerInvoiceLines.customerInvoiceId, invoiceId));

    for (const l of lines) {
      if (!l.productId) continue;
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${l.quantity}` })
        .where(and(eq(products.id, l.productId), eq(products.trackStock, true)));
    }

    await tx
      .update(customerInvoices)
      .set({ deletedAt: new Date() })
      .where(eq(customerInvoices.id, invoiceId));
  });
}

/** Batalkan tagihan pemasok: jurnal pembalik + soft delete. */
export async function deleteSupplierInvoice(invoiceId: number): Promise<void> {
  await db.transaction(async (tx) => {
    const [invoice] = await tx
      .select({ id: supplierInvoices.id, invoiceNumber: supplierInvoices.invoiceNumber })
      .from(supplierInvoices)
      .where(and(eq(supplierInvoices.id, invoiceId), isNull(supplierInvoices.deletedAt)))
      .limit(1);

    if (!invoice) throw new CorrectionError("Tagihan tidak ditemukan.");

    const journal = await findJournal(tx, "supplier_invoice", invoiceId);
    if (journal) {
      await createReversalJournal(
        tx,
        journal.id,
        journal.referenceNumber,
        `Pembatalan tagihan ${invoice.invoiceNumber}`,
      );
    }

    await tx
      .update(supplierInvoices)
      .set({ deletedAt: new Date() })
      .where(eq(supplierInvoices.id, invoiceId));
  });
}
