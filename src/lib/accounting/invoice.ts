/**
 * Logika invoice — port dari CustomerInvoice / SupplierInvoice (Laravel).
 *
 * Semua fungsi di sini MURNI (tidak menyentuh DB) supaya bisa diuji dan
 * dipakai ulang. Pola sama dengan reports.ts.
 */

import { round2 } from "./balance";

export interface InvoiceLineInput {
  productId?: number | null;
  description?: string | null;
  quantity: number;
  unitPrice: number;
}

export class InvoiceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceValidationError";
  }
}

/** Subtotal satu baris = quantity × unitPrice. */
export function lineSubtotal(line: InvoiceLineInput): number {
  return round2((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0));
}

/** Total invoice dari baris-barisnya + persentase pajak. */
export function computeInvoiceTotals(
  lines: InvoiceLineInput[],
  taxPercentage: number,
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = round2(lines.reduce((s, l) => s + lineSubtotal(l), 0));
  const pct = Number(taxPercentage) || 0;
  const taxAmount = round2((subtotal * pct) / 100);
  return { subtotal, taxAmount, total: round2(subtotal + taxAmount) };
}

/** Validasi input invoice. Melempar InvoiceValidationError bila tidak valid. */
export function validateInvoice(input: {
  invoiceNumber: string;
  invoiceDate: string;
  taxPercentage: number;
  lines: InvoiceLineInput[];
}): void {
  if (!input.invoiceNumber?.trim()) {
    throw new InvoiceValidationError("Nomor invoice wajib diisi.");
  }
  if (!input.invoiceDate) {
    throw new InvoiceValidationError("Tanggal invoice wajib diisi.");
  }

  const pct = Number(input.taxPercentage) || 0;
  if (pct < 0 || pct > 100) {
    throw new InvoiceValidationError("Persentase pajak harus antara 0 dan 100.");
  }

  const lines = input.lines ?? [];
  if (lines.length === 0) {
    throw new InvoiceValidationError("Invoice minimal punya 1 baris.");
  }

  for (const [i, l] of lines.entries()) {
    const qty = Number(l.quantity) || 0;
    const price = Number(l.unitPrice) || 0;

    if (qty <= 0) {
      throw new InvoiceValidationError(`Baris ${i + 1}: jumlah harus lebih dari 0.`);
    }
    if (price < 0) {
      throw new InvoiceValidationError(`Baris ${i + 1}: harga tidak boleh negatif.`);
    }
  }

  const { total } = computeInvoiceTotals(lines, pct);
  if (total <= 0) {
    throw new InvoiceValidationError("Total invoice harus lebih dari 0.");
  }
}

/** Validasi stok: pastikan stok cukup untuk semua baris yang dilacak. */
export function validateStock(
  lines: InvoiceLineInput[],
  products: { id: number; name: string; stock: number; trackStock: boolean }[],
): void {
  for (const line of lines) {
    if (!line.productId) continue;
    const product = products.find((p) => p.id === line.productId);
    if (!product || !product.trackStock) continue;

    const needed = Number(line.quantity) || 0;
    if (needed > product.stock) {
      throw new InvoiceValidationError(
        `Stok produk "${product.name}" tidak cukup. Tersedia: ${product.stock}, diminta: ${needed}.`,
      );
    }
  }
}

// ============================ Jurnal ============================

export interface JournalLineSpec {
  accountId: number;
  debit: number;
  credit: number;
  description: string;
}

export interface PostingAccounts {
  cash: number;
  ar: number;
  ap: number;
  revenue: number;
  expense: number;
  outputTax: number;
  inputTax: number;
}

export interface InvoiceForPosting {
  invoiceNumber: string;
  status: string; // unpaid | paid
  taxPercentage: number;
  lines: InvoiceLineInput[];
  partyName: string;
}

/**
 * Susun baris jurnal untuk Customer Invoice.
 *
 *   unpaid:  Dr Piutang Usaha      | Cr Pendapatan (+ Cr PPN Keluaran)
 *   paid:    Dr Kas/Bank           | Cr Pendapatan (+ Cr PPN Keluaran)
 */
export function buildCustomerInvoiceJournal(
  invoice: InvoiceForPosting,
  acc: PostingAccounts,
): JournalLineSpec[] {
  const { subtotal, taxAmount, total } = computeInvoiceTotals(
    invoice.lines,
    invoice.taxPercentage,
  );

  const debitAccount = invoice.status === "paid" ? acc.cash : acc.ar;
  const lines: JournalLineSpec[] = [
    {
      accountId: debitAccount,
      debit: total,
      credit: 0,
      description: `Total tagihan ${invoice.invoiceNumber}`,
    },
    {
      accountId: acc.revenue,
      debit: 0,
      credit: subtotal,
      description: `Penjualan ke ${invoice.partyName}`,
    },
  ];

  if (taxAmount > 0) {
    lines.push({
      accountId: acc.outputTax,
      debit: 0,
      credit: taxAmount,
      description: `PPN Keluaran ${invoice.taxPercentage}%`,
    });
  }

  return lines;
}

/**
 * Susun baris jurnal untuk Supplier Invoice.
 *
 *   unpaid:  Dr Beban (+ Dr PPN Masukan) | Cr Utang Usaha
 *   paid:    Dr Beban (+ Dr PPN Masukan) | Cr Kas/Bank
 */
export function buildSupplierInvoiceJournal(
  invoice: InvoiceForPosting,
  acc: PostingAccounts,
): JournalLineSpec[] {
  const { subtotal, taxAmount, total } = computeInvoiceTotals(
    invoice.lines,
    invoice.taxPercentage,
  );

  const lines: JournalLineSpec[] = [
    {
      accountId: acc.expense,
      debit: subtotal,
      credit: 0,
      description: `Pembelian dari ${invoice.partyName}`,
    },
  ];

  if (taxAmount > 0) {
    lines.push({
      accountId: acc.inputTax,
      debit: taxAmount,
      credit: 0,
      description: `PPN Masukan ${invoice.taxPercentage}%`,
    });
  }

  const creditAccount = invoice.status === "paid" ? acc.cash : acc.ap;
  lines.push({
    accountId: creditAccount,
    debit: 0,
    credit: total,
    description: `Total tagihan ${invoice.invoiceNumber}`,
  });

  return lines;
}
