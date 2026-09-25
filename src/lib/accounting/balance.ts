/**
 * Aturan saldo akuntansi — port dari App\Models\Account (Laravel).
 *
 * Satu sumber kebenaran untuk rumus saldo, dipakai bersama oleh laporan
 * dan posting jurnal. Kalau rumus di sini berubah, semua laporan ikut.
 */

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

/** Tipe akun yang saldo normalnya di sisi DEBIT. */
export const DEBIT_NORMAL_TYPES: readonly AccountType[] = ["asset", "expense"];

export function isDebitNormal(type: AccountType): boolean {
  return DEBIT_NORMAL_TYPES.includes(type);
}

/**
 * Hitung saldo dari angka debit/credit yang sudah dijumlahkan.
 *   asset/expense  : initial + debit - credit
 *   lainnya        : initial + credit - debit
 */
export function balanceFrom(
  type: AccountType,
  initialBalance: number,
  debit: number,
  credit: number,
): number {
  const initial = Number(initialBalance) || 0;
  if (isDebitNormal(type)) {
    return initial + debit - credit;
  }
  return initial + credit - debit;
}

/**
 * Mutasi (perubahan) sebuah akun dalam sebuah rentang.
 * Untuk akun debit-normal: debit menambah, credit mengurangi.
 */
export function flowFrom(type: AccountType, debit: number, credit: number): number {
  if (isDebitNormal(type)) {
    return debit - credit;
  }
  return credit - debit;
}

/**
 * Pembulatan uang 2 desimal — dipakai supaya perbandingan debit vs credit
 * tidak gagal karena galat floating point (mis. 0.1 + 0.2).
 */
export function round2(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/** Jurnal dianggap balance bila selisih debit-kredit < 1 sen. */
export function isBalanced(debit: number, credit: number): boolean {
  return Math.abs(round2(debit) - round2(credit)) < 0.01;
}
