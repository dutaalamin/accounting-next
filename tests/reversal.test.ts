/**
 * Test jurnal pembalik (koreksi invoice).
 *
 * Ini mengunci bug yang pernah terjadi: jurnal asli TIDAK boleh ikut
 * disembunyikan saat membuat jurnal pembalik, karena efeknya jadi
 * pembatalan GANDA dan saldo akun berbalik tanda (mis. Piutang minus).
 *
 * Logika yang diuji di sini adalah perhitungan murni: gabungan jurnal asli
 * + jurnal pembalik harus menghasilkan NET NOL pada akun yang terpengaruh.
 */

import { describe, it, expect } from "vitest";
import { round2 } from "../src/lib/accounting/balance";

interface Line {
  accountId: number;
  debit: number;
  credit: number;
}

/** Tukar debit & kredit — persis seperti createReversalJournal. */
function reverseLines(lines: Line[]): Line[] {
  return lines.map((l) => ({
    accountId: l.accountId,
    debit: l.credit,
    credit: l.debit,
  }));
}

function netByAccount(lines: Line[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const l of lines) {
    m.set(l.accountId, round2((m.get(l.accountId) ?? 0) + l.debit - l.credit));
  }
  return m;
}

describe("jurnal pembalik meniadakan jurnal asli", () => {
  // Jurnal invoice pelanggan Rp 195.000 (Dr Piutang, Cr Pendapatan)
  const original: Line[] = [
    { accountId: 113, debit: 195000, credit: 0 },
    { accountId: 411, debit: 0, credit: 195000 },
  ];

  it("gabungan asli + pembalik menghasilkan net nol (bukan minus)", () => {
    const combined = [...original, ...reverseLines(original)];
    const net = netByAccount(combined);

    // Inilah bug yang dicegah: harus 0, BUKAN -195000.
    expect(net.get(113)).toBe(0);
    expect(net.get(411)).toBe(0);
  });

  it("kalau jurnal asli ikut disembunyikan -> jadi MINUS (bug lama)", () => {
    // Simulasi bug: hanya pembalik yang dihitung.
    const onlyReversal = reverseLines(original);
    const net = netByAccount(onlyReversal);

    // Piutang jadi -195000 — inilah yang TIDAK boleh terjadi.
    expect(net.get(113)).toBe(-195000);
  });

  it("pembalik tetap balance (total debit = total kredit)", () => {
    const rev = reverseLines(original);
    const d = round2(rev.reduce((s, l) => s + l.debit, 0));
    const c = round2(rev.reduce((s, l) => s + l.credit, 0));
    expect(d).toBe(c);
  });

  it("dengan PPN, semua akun kembali nol", () => {
    const withTax: Line[] = [
      { accountId: 113, debit: 1110000, credit: 0 },
      { accountId: 411, debit: 0, credit: 1000000 },
      { accountId: 212, debit: 0, credit: 110000 },
    ];
    const net = netByAccount([...withTax, ...reverseLines(withTax)]);
    expect(net.get(113)).toBe(0);
    expect(net.get(411)).toBe(0);
    expect(net.get(212)).toBe(0);
  });
});
