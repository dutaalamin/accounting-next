"use client";

import { MessageCircle } from "lucide-react";
import { formatRupiah } from "@/lib/format";

interface Props {
  invoiceNumber: string;
  partyName: string;
  partyPhone: string | null;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number;
  status: string;
  /** Daftar baris: nama produk + subtotal. */
  lines: { productName: string | null; description: string | null; quantity: number; subtotal: number }[];
  /** Nama perusahaan pengirim (dari env atau default). */
  companyName?: string;
}

/** Bersihkan nomor HP jadi format internasional Indonesia (628xxx). */
function normalisasiNomor(nomor: string): string {
  let n = nomor.replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("8")) n = "62" + n;
  return n;
}

/** Bangun pesan invoice (teks WhatsApp). */
function buatPesan(p: Props): string {
  const baris = p.lines
    .map((l) => {
      const nama = l.productName ?? l.description ?? "-";
      return `• ${nama} x${l.quantity} = ${formatRupiah(l.subtotal)}`;
    })
    .join("\n");

  const status = p.status === "paid" ? "LUNAS" : "BELUM LUNAS";

  return [
    `*${p.companyName ?? "Invoice"}*`,
    `Invoice: ${p.invoiceNumber}`,
    `Tanggal: ${p.invoiceDate}`,
    p.dueDate ? `Jatuh tempo: ${p.dueDate}` : null,
    "",
    `Kepada: ${p.partyName}`,
    "",
    "Rincian:",
    baris,
    "",
    `*Total: ${formatRupiah(p.totalAmount)}*`,
    `Status: ${status}`,
    "",
    "Terima kasih.",
  ]
    .filter((x) => x !== null)
    .join("\n");
}

export function WhatsappInvoiceButton(props: Props) {
  function kirim() {
    const pesan = encodeURIComponent(buatPesan(props));
    const nomor = props.partyPhone ? normalisasiNomor(props.partyPhone) : "";
    // Kalau ada nomor -> langsung ke chat orangnya. Kalau tidak -> pilih kontak.
    const url = nomor
      ? `https://wa.me/${nomor}?text=${pesan}`
      : `https://wa.me/?text=${pesan}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={kirim}
      title={
        props.partyPhone
          ? `Kirim ke WhatsApp ${props.partyPhone}`
          : "Nomor pelanggan belum ada, akan diminta pilih kontak"
      }
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 text-[13px] font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
    >
      <MessageCircle size={15} />
      Kirim WhatsApp
    </button>
  );
}
