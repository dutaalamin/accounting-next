/**
 * Utilitas tanggal untuk laporan.
 *
 * Kalau pengguna salah mengisi rentang (dari > sampai), kita TIDAK diam-diam
 * menghitung angka menyesatkan — rentang ditukar otomatis dan UI menampilkan
 * peringatan.
 */

export interface DateRange {
  start: string;
  end: string;
  swapped: boolean;
}

/** Format YYYY-MM-DD. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function startOfYearISO(): string {
  return `${new Date().getFullYear()}-01-01`;
}

/**
 * Rapikan rentang tanggal. Bila `start` > `end`, keduanya ditukar dan
 * `swapped` bernilai true supaya UI bisa memberi tahu pengguna.
 */
export function normalizeRange(
  start: string | undefined,
  end: string | undefined,
): DateRange {
  const s = start || startOfYearISO();
  const e = end || todayISO();

  if (s > e) {
    return { start: e, end: s, swapped: true };
  }
  return { start: s, end: e, swapped: false };
}

/** Validasi format tanggal sederhana (YYYY-MM-DD). */
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
