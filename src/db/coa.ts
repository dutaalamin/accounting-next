/**
 * Chart of Accounts (COA) — port dari database/seeders/COASeeder.php
 * di project Laravel `accounting`.
 */

import type { AccountType } from "@/lib/accounting/balance";

export interface CoaItem {
  code: string;
  name: string;
  type: AccountType;
}

export const COA: CoaItem[] = [
  // Aset
  { code: "111", name: "Kas Proyek", type: "asset" },
  { code: "112", name: "Bank BCA (Pusat)", type: "asset" },
  { code: "113", name: "Piutang Usaha", type: "asset" },
  { code: "114", name: "Uang Muka Pembelian", type: "asset" },
  { code: "115", name: "PPN Masukan", type: "asset" },

  // Kewajiban
  { code: "211", name: "Utang Usaha", type: "liability" },
  { code: "212", name: "PPN Keluaran", type: "liability" },

  // Ekuitas
  { code: "311", name: "Modal Pemilik", type: "equity" },
  { code: "312", name: "Laba Ditahan", type: "equity" },

  // Pendapatan
  { code: "411", name: "Pendapatan Termin Proyek", type: "revenue" },
  { code: "412", name: "Pendapatan Jasa Tambahan", type: "revenue" },

  // Beban
  { code: "511", name: "Beban Material Bangunan", type: "expense" },
  { code: "512", name: "Beban Upah Tukang & Mandor", type: "expense" },
  { code: "513", name: "Beban Sewa Alat Berat", type: "expense" },
  { code: "514", name: "Beban Operasional Kantor", type: "expense" },
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: "Aset",
  liability: "Kewajiban",
  equity: "Modal",
  revenue: "Pendapatan",
  expense: "Beban",
};
