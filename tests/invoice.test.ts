/**
 * Test logika invoice & posting jurnal.
 * Port dari JournalPostingServiceTest (Laravel) — angkanya harus sama.
 */

import { describe, it, expect } from "vitest";
import {
  lineSubtotal,
  computeInvoiceTotals,
  validateInvoice,
  validateStock,
  buildCustomerInvoiceJournal,
  buildSupplierInvoiceJournal,
  type PostingAccounts,
} from "../src/lib/accounting/invoice";

const ACC: PostingAccounts = {
  cash: 1,
  ar: 3,
  ap: 4,
  revenue: 7,
  expense: 8,
  outputTax: 5,
  inputTax: 6,
};

describe("subtotal & total invoice", () => {
  it("subtotal = quantity x unitPrice", () => {
    expect(lineSubtotal({ quantity: 3, unitPrice: 50000 })).toBe(150000);
    expect(lineSubtotal({ quantity: 2, unitPrice: 250000 })).toBe(500000);
  });

  it("menghitung total dengan PPN", () => {
    const r = computeInvoiceTotals([{ quantity: 1, unitPrice: 1000000 }], 11);
    expect(r.subtotal).toBe(1000000);
    expect(r.taxAmount).toBe(110000);
    expect(r.total).toBe(1110000);
  });

  it("tanpa PPN, total = subtotal", () => {
    const r = computeInvoiceTotals([{ quantity: 2, unitPrice: 50000 }], 0);
    expect(r.total).toBe(100000);
  });
});

describe("validasi invoice", () => {
  const base = { invoiceNumber: "INV-001", invoiceDate: "2026-03-10", taxPercentage: 0 };

  it("menerima invoice valid", () => {
    expect(() =>
      validateInvoice({ ...base, lines: [{ quantity: 1, unitPrice: 100000 }] }),
    ).not.toThrow();
  });

  it("menolak nomor invoice kosong", () => {
    expect(() =>
      validateInvoice({
        ...base,
        invoiceNumber: " ",
        lines: [{ quantity: 1, unitPrice: 100000 }],
      }),
    ).toThrow(/Nomor invoice/);
  });

  it("menolak invoice tanpa baris", () => {
    expect(() => validateInvoice({ ...base, lines: [] })).toThrow(/minimal punya 1 baris/);
  });

  it("menolak quantity nol / negatif", () => {
    expect(() =>
      validateInvoice({ ...base, lines: [{ quantity: 0, unitPrice: 100000 }] }),
    ).toThrow(/jumlah harus lebih dari 0/);
    expect(() =>
      validateInvoice({ ...base, lines: [{ quantity: -5, unitPrice: 100000 }] }),
    ).toThrow(/jumlah harus lebih dari 0/);
  });

  it("menolak harga negatif", () => {
    expect(() =>
      validateInvoice({ ...base, lines: [{ quantity: 1, unitPrice: -1000 }] }),
    ).toThrow(/harga tidak boleh negatif/);
  });

  it("menolak pajak di luar 0-100", () => {
    expect(() =>
      validateInvoice({
        ...base,
        taxPercentage: 150,
        lines: [{ quantity: 1, unitPrice: 100000 }],
      }),
    ).toThrow(/Persentase pajak/);
  });

  it("menolak total nol", () => {
    expect(() =>
      validateInvoice({ ...base, lines: [{ quantity: 1, unitPrice: 0 }] }),
    ).toThrow(/Total invoice/);
  });
});

describe("validasi stok", () => {
  const products = [
    { id: 10, name: "Barang A", stock: 5, trackStock: true },
    { id: 11, name: "Jasa B", stock: 0, trackStock: false },
  ];

  it("lolos bila stok cukup", () => {
    expect(() => validateStock([{ productId: 10, quantity: 5, unitPrice: 1000 }], products)).not.toThrow();
  });

  it("menolak bila stok kurang", () => {
    expect(() =>
      validateStock([{ productId: 10, quantity: 6, unitPrice: 1000 }], products),
    ).toThrow(/tidak cukup/);
  });

  it("produk jasa (trackStock=false) tidak dicek", () => {
    expect(() =>
      validateStock([{ productId: 11, quantity: 99, unitPrice: 1000 }], products),
    ).not.toThrow();
  });
});

describe("jurnal invoice pelanggan", () => {
  it("unpaid: Dr Piutang, Cr Pendapatan", () => {
    const lines = buildCustomerInvoiceJournal(
      {
        invoiceNumber: "INV-001",
        status: "unpaid",
        taxPercentage: 0,
        lines: [{ quantity: 1, unitPrice: 100000 }],
        partyName: "Pelanggan A",
      },
      ACC,
    );
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ accountId: ACC.ar, debit: 100000, credit: 0 });
    expect(lines[1]).toMatchObject({ accountId: ACC.revenue, debit: 0, credit: 100000 });
  });

  it("paid: Dr Kas, Cr Pendapatan", () => {
    const lines = buildCustomerInvoiceJournal(
      {
        invoiceNumber: "INV-002",
        status: "paid",
        taxPercentage: 0,
        lines: [{ quantity: 2, unitPrice: 50000 }],
        partyName: "Pelanggan B",
      },
      ACC,
    );
    expect(lines[0]).toMatchObject({ accountId: ACC.cash, debit: 100000 });
  });

  it("dengan PPN: ada baris PPN Keluaran & tetap balance", () => {
    const lines = buildCustomerInvoiceJournal(
      {
        invoiceNumber: "INV-003",
        status: "unpaid",
        taxPercentage: 11,
        lines: [{ quantity: 1, unitPrice: 1000000 }],
        partyName: "Pelanggan C",
      },
      ACC,
    );
    const tax = lines.find((l) => l.accountId === ACC.outputTax);
    expect(tax).toBeDefined();
    expect(tax!.credit).toBe(110000);

    const debit = lines.reduce((s, l) => s + l.debit, 0);
    const credit = lines.reduce((s, l) => s + l.credit, 0);
    expect(Math.round(debit * 100) / 100).toBe(Math.round(credit * 100) / 100);
    expect(debit).toBe(1110000);
  });
});

describe("jurnal invoice pemasok", () => {
  it("unpaid: Dr Beban, Cr Utang", () => {
    const lines = buildSupplierInvoiceJournal(
      {
        invoiceNumber: "SUP-001",
        status: "unpaid",
        taxPercentage: 0,
        lines: [{ quantity: 10, unitPrice: 50000 }],
        partyName: "Vendor A",
      },
      ACC,
    );
    expect(lines.find((l) => l.accountId === ACC.expense)).toMatchObject({ debit: 500000 });
    expect(lines.find((l) => l.accountId === ACC.ap)).toMatchObject({ credit: 500000 });
  });

  it("paid: Cr Kas", () => {
    const lines = buildSupplierInvoiceJournal(
      {
        invoiceNumber: "SUP-002",
        status: "paid",
        taxPercentage: 0,
        lines: [{ quantity: 1, unitPrice: 100000 }],
        partyName: "Vendor B",
      },
      ACC,
    );
    expect(lines.find((l) => l.accountId === ACC.cash)).toMatchObject({ credit: 100000 });
  });

  it("dengan PPN Masukan: tetap balance", () => {
    const lines = buildSupplierInvoiceJournal(
      {
        invoiceNumber: "SUP-003",
        status: "unpaid",
        taxPercentage: 11,
        lines: [{ quantity: 1, unitPrice: 1000000 }],
        partyName: "Vendor C",
      },
      ACC,
    );
    const debit = lines.reduce((s, l) => s + l.debit, 0);
    const credit = lines.reduce((s, l) => s + l.credit, 0);
    expect(debit).toBe(1110000);
    expect(credit).toBe(1110000);
  });
});
