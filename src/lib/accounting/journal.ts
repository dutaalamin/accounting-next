/**
 * Validasi & pembuatan jurnal manual (double-entry).
 *
 * Aturan yang diport dari Laravel:
 *  - Total debit HARUS sama dengan total credit (balance), toleransi < 1 sen.
 *  - Satu baris tidak boleh mengisi debit DAN credit sekaligus.
 *  - Nilai tidak boleh negatif.
 *  - Minimal 2 baris.
 *  - Jurnal yang sudah diposting tidak boleh diubah/dihapus (posted guard).
 */

import { isBalanced, round2 } from "./balance";

export interface JournalLineInput {
  accountId: number;
  debit: number;
  credit: number;
  description?: string | null;
}

export interface JournalInput {
  referenceNumber: string;
  date: string; // YYYY-MM-DD
  description?: string | null;
  lines: JournalLineInput[];
}

export class JournalValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JournalValidationError";
  }
}

/** Validasi baris jurnal. Melempar JournalValidationError bila tidak valid. */
export function validateJournal(input: JournalInput): void {
  const lines = input.lines ?? [];

  if (!input.referenceNumber?.trim()) {
    throw new JournalValidationError("Nomor bukti wajib diisi.");
  }
  if (!input.date) {
    throw new JournalValidationError("Tanggal wajib diisi.");
  }
  if (lines.length < 2) {
    throw new JournalValidationError("Jurnal minimal terdiri dari 2 baris (debit dan kredit).");
  }

  for (const [i, line] of lines.entries()) {
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;

    if (!line.accountId) {
      throw new JournalValidationError(`Baris ${i + 1}: akun belum dipilih.`);
    }
    if (debit < 0 || credit < 0) {
      throw new JournalValidationError(`Baris ${i + 1}: nilai tidak boleh negatif.`);
    }
    if (debit > 0 && credit > 0) {
      throw new JournalValidationError(
        `Baris ${i + 1}: isi hanya Debit ATAU Kredit, tidak boleh keduanya.`,
      );
    }
    if (debit === 0 && credit === 0) {
      throw new JournalValidationError(`Baris ${i + 1}: isi debit atau kredit.`);
    }
  }

  const totalDebit = round2(lines.reduce((s, l) => s + (Number(l.debit) || 0), 0));
  const totalCredit = round2(lines.reduce((s, l) => s + (Number(l.credit) || 0), 0));

  if (!isBalanced(totalDebit, totalCredit)) {
    throw new JournalValidationError(
      `Transaksi tidak balance. Total Debit (${totalDebit}) harus sama dengan Total Kredit (${totalCredit}).`,
    );
  }
}

export function journalTotals(lines: JournalLineInput[]): { debit: number; credit: number } {
  return {
    debit: round2(lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)),
    credit: round2(lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)),
  };
}
