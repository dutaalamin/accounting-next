/**
 * Ekspor data ke CSV.
 *
 *   GET /api/export/accounts
 *   GET /api/export/journals
 *   GET /api/export/customer-invoices
 *   GET /api/export/supplier-invoices
 *   GET /api/export/products
 *   GET /api/export/customers
 *   GET /api/export/vendors
 *
 * Hanya untuk user yang sudah login.
 */

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAccounts,
  getJournalEntries,
  getCustomerInvoices,
  getSupplierInvoices,
  getProducts,
  getCustomers,
  getVendors,
} from "@/lib/queries";

/** Bungkus nilai agar aman di CSV (kutip ganda + escape). */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const r of rows) lines.push(r.map(csvCell).join(","));
  // BOM agar Excel membaca UTF-8 dengan benar.
  return "\uFEFF" + lines.join("\r\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const { type } = await params;
  let csv = "";
  let filename = "";

  switch (type) {
    case "accounts": {
      const rows = await getAccounts();
      csv = toCsv(
        ["Kode", "Nama", "Tipe", "Saldo Awal"],
        rows.map((a) => [a.code, a.name, a.type, a.initialBalance]),
      );
      filename = "akun.csv";
      break;
    }
    case "journals": {
      const rows = await getJournalEntries();
      csv = toCsv(
        ["Tanggal", "Nomor Bukti", "Keterangan", "Baris", "Status", "Total"],
        rows.map((j) => [
          j.date,
          j.referenceNumber,
          j.description ?? "",
          j.lineCount,
          j.isPosted ? "Posted" : "Draft",
          j.total,
        ]),
      );
      filename = "jurnal.csv";
      break;
    }
    case "customer-invoices": {
      const rows = await getCustomerInvoices();
      csv = toCsv(
        ["Tanggal", "Nomor Invoice", "Pelanggan", "Jatuh Tempo", "Status", "Total"],
        rows.map((i) => [
          i.invoiceDate,
          i.invoiceNumber,
          i.partyName,
          i.dueDate ?? "",
          i.status === "paid" ? "Lunas" : "Belum Lunas",
          i.totalAmount,
        ]),
      );
      filename = "tagihan-pelanggan.csv";
      break;
    }
    case "supplier-invoices": {
      const rows = await getSupplierInvoices();
      csv = toCsv(
        ["Tanggal", "Nomor Tagihan", "Pemasok", "Jatuh Tempo", "Status", "Total"],
        rows.map((i) => [
          i.invoiceDate,
          i.invoiceNumber,
          i.partyName,
          i.dueDate ?? "",
          i.status === "paid" ? "Lunas" : "Belum Lunas",
          i.totalAmount,
        ]),
      );
      filename = "tagihan-pemasok.csv";
      break;
    }
    case "products": {
      const rows = await getProducts();
      csv = toCsv(
        ["SKU", "Nama", "Harga", "Stok", "Lacak Stok", "Deskripsi"],
        rows.map((p) => [
          p.sku ?? "",
          p.name,
          p.price,
          p.trackStock ? p.stock : "",
          p.trackStock ? "Ya" : "Tidak",
          p.description ?? "",
        ]),
      );
      filename = "produk.csv";
      break;
    }
    case "customers": {
      const rows = await getCustomers();
      csv = toCsv(
        ["Nama", "Email", "Telepon", "Alamat"],
        rows.map((c) => [c.name, c.email ?? "", c.phone ?? "", c.address ?? ""]),
      );
      filename = "pelanggan.csv";
      break;
    }
    case "vendors": {
      const rows = await getVendors();
      csv = toCsv(
        ["Nama", "Email", "Telepon", "Alamat"],
        rows.map((v) => [v.name, v.email ?? "", v.phone ?? "", v.address ?? ""]),
      );
      filename = "pemasok.csv";
      break;
    }
    default:
      return NextResponse.json({ error: "Jenis ekspor tidak dikenal." }, { status: 404 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
