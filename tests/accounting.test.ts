/**
 * Test logika akuntansi — port dari test Laravel (JournalIntegrityTest,
 * NeracaReportTest, JournalPostingServiceTest) yang relevan untuk MVP.
 *
 * Tujuan: memastikan port ke TypeScript menghasilkan angka yang SAMA
 * dengan implementasi Laravel.
 */

import { describe, it, expect } from "vitest";
import {
  balanceFrom,
  flowFrom,
  round2,
  isBalanced,
} from "../src/lib/accounting/balance";
import {
  buildNeraca,
  buildLabaRugi,
  buildArusKas,
  type AccountRow,
  type JournalLineRow,
} from "../src/lib/accounting/reports";
import { validateJournal, JournalValidationError } from "../src/lib/accounting/journal";

// COA minimum (mirror dari seedAccounts() di test Laravel).
const A = {
  kas: { id: 1, code: "111", name: "Kas Proyek", type: "asset" as const, initialBalance: 0 },
  bank: { id: 2, code: "112", name: "Bank BCA", type: "asset" as const, initialBalance: 0 },
  ar: { id: 3, code: "113", name: "Piutang Usaha", type: "asset" as const, initialBalance: 0 },
  ap: { id: 4, code: "211", name: "Utang Usaha", type: "liability" as const, initialBalance: 0 },
  ppn: { id: 5, code: "212", name: "PPN Keluaran", type: "liability" as const, initialBalance: 0 },
  modal: { id: 6, code: "311", name: "Modal Pemilik", type: "equity" as const, initialBalance: 0 },
  pendapatan: { id: 7, code: "411", name: "Pendapatan", type: "revenue" as const, initialBalance: 0 },
  beban: { id: 8, code: "511", name: "Beban Material", type: "expense" as const, initialBalance: 0 },
};
const ACCOUNTS: AccountRow[] = Object.values(A);

/** Helper: buat baris jurnal yang sah (posted, tidak dihapus). */
function line(
  accountId: number,
  debit: number,
  credit: number,
  date = "2026-03-10",
): JournalLineRow {
  return { accountId, debit, credit, date, isPosted: true, deleted: false };
}

describe("balance rules", () => {
  it("asset/expense: saldo = initial + debit - credit", () => {
    expect(balanceFrom("asset", 500000, 300000, 0)).toBe(800000);
    expect(balanceFrom("expense", 0, 100000, 20000)).toBe(80000);
  });

  it("liability/equity/revenue: saldo = initial + credit - debit", () => {
    expect(balanceFrom("revenue", 0, 0, 500000)).toBe(500000);
    expect(balanceFrom("liability", 100000, 40000, 0)).toBe(60000);
  });

  it("flow: debit-normal bertambah dengan debit, lainnya dengan credit", () => {
    expect(flowFrom("asset", 100000, 30000)).toBe(70000);
    expect(flowFrom("revenue", 10000, 50000)).toBe(40000);
  });

  it("isBalanced toleran terhadap galat floating point", () => {
    expect(isBalanced(0.1 + 0.2, 0.3)).toBe(true);
    expect(isBalanced(100, 100.02)).toBe(false);
  });
});

describe("jurnal: validasi double-entry", () => {
  const base = { referenceNumber: "J-001", date: "2026-03-10" };

  it("menerima jurnal yang balance", () => {
    expect(() =>
      validateJournal({
        ...base,
        lines: [
          { accountId: A.kas.id, debit: 100000, credit: 0 },
          { accountId: A.pendapatan.id, debit: 0, credit: 100000 },
        ],
      }),
    ).not.toThrow();
  });

  it("menolak jurnal yang tidak balance", () => {
    expect(() =>
      validateJournal({
        ...base,
        lines: [
          { accountId: A.kas.id, debit: 100000, credit: 0 },
          { accountId: A.pendapatan.id, debit: 0, credit: 90000 },
        ],
      }),
    ).toThrow(JournalValidationError);
  });

  it("menolak baris yang mengisi debit DAN credit sekaligus", () => {
    expect(() =>
      validateJournal({
        ...base,
        lines: [
          { accountId: A.kas.id, debit: 100000, credit: 100000 },
          { accountId: A.pendapatan.id, debit: 0, credit: 100000 },
        ],
      }),
    ).toThrow(/Debit ATAU Kredit/);
  });

  it("menolak nilai negatif", () => {
    expect(() =>
      validateJournal({
        ...base,
        lines: [
          { accountId: A.kas.id, debit: -100, credit: 0 },
          { accountId: A.pendapatan.id, debit: 0, credit: -100 },
        ],
      }),
    ).toThrow(/negatif/);
  });

  it("menolak jurnal dengan kurang dari 2 baris", () => {
    expect(() =>
      validateJournal({ ...base, lines: [{ accountId: A.kas.id, debit: 0, credit: 0 }] }),
    ).toThrow(/2 baris/);
  });

  it("menolak nomor bukti kosong", () => {
    expect(() =>
      validateJournal({
        referenceNumber: "  ",
        date: "2026-03-10",
        lines: [
          { accountId: A.kas.id, debit: 100, credit: 0 },
          { accountId: A.pendapatan.id, debit: 0, credit: 100 },
        ],
      }),
    ).toThrow(/Nomor bukti/);
  });
});

describe("neraca", () => {
  it("persamaan Aset = Kewajiban + Modal (+ Laba Berjalan)", () => {
    // Kas 1.000.000, Modal 1.000.000 (initial balance)
    const accounts: AccountRow[] = [
      { ...A.kas, initialBalance: 1000000 },
      { ...A.modal, initialBalance: 1000000 },
      A.pendapatan,
      A.beban,
      A.ar,
      A.ap,
      A.ppn,
      A.bank,
    ];
    // Transaksi: Pendapatan 200.000 (Kas bertambah, Pendapatan bertambah)
    const lines = [
      line(A.kas.id, 200000, 0, "2026-03-10"),
      line(A.pendapatan.id, 0, 200000, "2026-03-10"),
    ];

    const r = buildNeraca(accounts, lines, "2026-03-10");
    expect(r.totalAsset).toBe(1200000);
    expect(r.currentYearIncome).toBe(200000);
    expect(r.totalEquity).toBe(1200000);
    expect(r.balanced).toBe(true);
  });

  it("laba berjalan hanya menghitung tahun berjalan", () => {
    const accounts: AccountRow[] = [
      { ...A.kas, initialBalance: 0 },
      A.pendapatan,
      A.beban,
      A.modal,
      A.ar,
      A.ap,
      A.ppn,
      A.bank,
    ];
    const lines = [
      // tahun lalu — TIDAK boleh masuk laba berjalan
      line(A.kas.id, 500000, 0, "2025-06-15"),
      line(A.pendapatan.id, 0, 500000, "2025-06-15"),
      // tahun ini — harus masuk
      line(A.kas.id, 200000, 0, "2026-03-10"),
      line(A.pendapatan.id, 0, 200000, "2026-03-10"),
    ];

    const r = buildNeraca(accounts, lines, "2026-03-10");
    expect(r.currentYearIncome).toBe(200000);
    // Aset = 700.000, Ekuitas = laba berjalan 200.000 -> belum balance
    // karena pendapatan tahun lalu tidak diakui di ekuitas (perilaku sama dgn Laravel).
    expect(r.totalAsset).toBe(700000);
  });

  it("mengabaikan jurnal yang belum diposting / sudah dihapus", () => {
    const accounts: AccountRow[] = [A.kas, A.pendapatan, A.modal, A.ar, A.ap, A.ppn, A.beban, A.bank];
    const lines: JournalLineRow[] = [
      { accountId: A.kas.id, debit: 100000, credit: 0, date: "2026-03-10", isPosted: false, deleted: false },
      { accountId: A.pendapatan.id, debit: 0, credit: 100000, date: "2026-03-10", isPosted: false, deleted: false },
      { accountId: A.kas.id, debit: 50000, credit: 0, date: "2026-03-10", isPosted: true, deleted: true },
      { accountId: A.pendapatan.id, debit: 0, credit: 50000, date: "2026-03-10", isPosted: true, deleted: true },
    ];
    const r = buildNeraca(accounts, lines, "2026-03-10");
    expect(r.totalAsset).toBe(0);
    expect(r.currentYearIncome).toBe(0);
  });
});

describe("laba rugi", () => {
  it("menghitung pendapatan, beban, dan laba bersih dalam rentang", () => {
    const lines = [
      line(A.kas.id, 150000, 0, "2026-03-05"),
      line(A.pendapatan.id, 0, 150000, "2026-03-05"),
      line(A.beban.id, 30000, 0, "2026-03-06"),
      line(A.kas.id, 0, 30000, "2026-03-06"),
      // di luar rentang — tidak dihitung
      line(A.kas.id, 900000, 0, "2026-05-01"),
      line(A.pendapatan.id, 0, 900000, "2026-05-01"),
    ];
    const r = buildLabaRugi(ACCOUNTS, lines, "2026-03-01", "2026-03-31");
    expect(r.totalRevenue).toBe(150000);
    expect(r.totalExpense).toBe(30000);
    expect(r.netIncome).toBe(120000);
  });
});

describe("arus kas", () => {
  it("menghitung arus operasi, investasi, pendanaan & saldo kas", () => {
    // Modal awal 100.000.000 masuk kas (pendanaan)
    const lines = [
      line(A.kas.id, 100000000, 0, "2026-01-05"),
      line(A.modal.id, 0, 100000000, "2026-01-05"),
      // Pendapatan 150.000.000 (operasi)
      line(A.kas.id, 150000000, 0, "2026-02-10"),
      line(A.pendapatan.id, 0, 150000000, "2026-02-10"),
      // Beban 3.350.000 (operasi, kas keluar)
      line(A.beban.id, 3350000, 0, "2026-02-15"),
      line(A.kas.id, 0, 3350000, "2026-02-15"),
    ];

    const r = buildArusKas(ACCOUNTS, lines, "2026-01-01", "2026-03-31");
    expect(r.financingFlow).toBe(100000000);
    expect(r.operatingFlow).toBe(round2(150000000 - 3350000));
    expect(r.investingFlow).toBe(0);
    expect(r.netChange).toBe(round2(150000000 - 3350000 + 100000000));
    expect(r.closingCash).toBe(r.netChange);
    expect(r.openingCash).toBe(0);
  });

  it("saldo kas awal = saldo sebelum start_date", () => {
    const lines = [
      line(A.kas.id, 10000000, 0, "2026-01-05"),
      line(A.modal.id, 0, 10000000, "2026-01-05"),
    ];
    const r = buildArusKas(ACCOUNTS, lines, "2026-02-01", "2026-02-28");
    expect(r.openingCash).toBe(10000000);
    expect(r.netChange).toBe(0);
    expect(r.closingCash).toBe(10000000);
  });
});
