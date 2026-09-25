/** Format angka ke Rupiah: 1234567.5 -> "Rp 1.234.567,5" -> "Rp 1.234.568" */

export function formatRupiah(value: number): string {
  const n = Number(value) || 0;
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
  return `Rp ${formatted}`;
}

/** Format angka dengan pemisah ribuan (tanpa "Rp"). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
}
