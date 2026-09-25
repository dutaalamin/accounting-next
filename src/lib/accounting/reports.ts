/**
 * Logika 4 laporan keuangan — port dari App\Filament\Pages\*Report (Laravel).
 *
 * Semua fungsi di sini MURNI terhadap data yang diberikan (tidak query DB),
 * supaya bisa diuji tanpa database dan dipakai ulang di server maupun client.
 *
 * Aturan yang harus dipertahankan (sesuai implementasi Laravel):
 *  - Hanya jurnal is_posted = true dan deleted_at IS NULL yang dihitung.
 *  - Neraca: Laba Berjalan HANYA tahun berjalan (bukan kumulatif).
 *  - Arus Kas: kas = akun asset berkode 111/112.
 */

import {
  type AccountType,
  balanceFrom,
  flowFrom,
  round2,
} from "./balance";

export interface AccountRow {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  initialBalance: number;
}

export interface JournalLineRow {
  accountId: number;
  debit: number;
  credit: number;
  /** Tanggal jurnal (YYYY-MM-DD). */
  date: string;
  /** Hanya baris dari jurnal yang diposting & tidak di-soft-delete. */
  isPosted: boolean;
  deleted: boolean;
}

/** Filter dasar: hanya baris jurnal yang sah. */
function validLines(lines: JournalLineRow[]): JournalLineRow[] {
  return lines.filter((l) => l.isPosted && !l.deleted);
}

function inRange(date: string, start?: string, end?: string): boolean {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

/** Jumlahkan debit & credit untuk satu akun (opsional dibatasi rentang tanggal). */
export function sumForAccount(
  lines: JournalLineRow[],
  accountId: number,
  start?: string,
  end?: string,
): { debit: number; credit: number } {
  let debit = 0;
  let credit = 0;
  for (const l of validLines(lines)) {
    if (l.accountId !== accountId) continue;
    if (!inRange(l.date, start, end)) continue;
    debit += Number(l.debit) || 0;
    credit += Number(l.credit) || 0;
  }
  return { debit: round2(debit), credit: round2(credit) };
}

/** Saldo akun sampai tanggal tertentu (inklusif). */
export function balanceUntil(account: AccountRow, lines: JournalLineRow[], asOfDate: string): number {
  const { debit, credit } = sumForAccount(lines, account.id, undefined, asOfDate);
  return round2(balanceFrom(account.type, account.initialBalance, debit, credit));
}

/** Saldo akun dalam rentang tanggal (untuk laba berjalan per tahun). */
export function balanceInRange(
  account: AccountRow,
  lines: JournalLineRow[],
  startDate: string,
  endDate: string,
): number {
  const { debit, credit } = sumForAccount(lines, account.id, startDate, endDate);
  return round2(balanceFrom(account.type, account.initialBalance, debit, credit));
}

// ============================ NERACA ============================

export interface NeracaResult {
  assetAccounts: (AccountRow & { balance: number })[];
  liabilityAccounts: (AccountRow & { balance: number })[];
  equityAccounts: (AccountRow & { balance: number })[];
  totalAsset: number;
  totalLiability: number;
  totalEquity: number;
  totalLiabilityEquity: number;
  currentYearIncome: number;
  balanced: boolean;
}

export function buildNeraca(
  accounts: AccountRow[],
  lines: JournalLineRow[],
  asOfDate: string,
): NeracaResult {
  const withBalance = (type: AccountType) =>
    accounts
      .filter((a) => a.type === type)
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((a) => ({ ...a, balance: balanceUntil(a, lines, asOfDate) }));

  const assetAccounts = withBalance("asset");
  const liabilityAccounts = withBalance("liability");
  const equityAccounts = withBalance("equity");

  const totalAsset = round2(assetAccounts.reduce((s, a) => s + a.balance, 0));
  const totalLiability = round2(liabilityAccounts.reduce((s, a) => s + a.balance, 0));
  let totalEquity = round2(equityAccounts.reduce((s, a) => s + a.balance, 0));

  // Laba berjalan HANYA tahun berjalan (bukan kumulatif).
  const yearStart = `${asOfDate.slice(0, 4)}-01-01`;
  let totalRevenue = 0;
  let totalExpense = 0;
  for (const a of accounts.filter((x) => x.type === "revenue")) {
    totalRevenue += balanceInRange(a, lines, yearStart, asOfDate);
  }
  for (const a of accounts.filter((x) => x.type === "expense")) {
    totalExpense += balanceInRange(a, lines, yearStart, asOfDate);
  }
  const currentYearIncome = round2(totalRevenue - totalExpense);
  totalEquity = round2(totalEquity + currentYearIncome);

  const totalLiabilityEquity = round2(totalLiability + totalEquity);

  return {
    assetAccounts,
    liabilityAccounts,
    equityAccounts,
    totalAsset,
    totalLiability,
    totalEquity,
    totalLiabilityEquity,
    currentYearIncome,
    balanced: Math.abs(totalAsset - totalLiabilityEquity) < 1,
  };
}

// ============================ LABA RUGI ============================

export interface LabaRugiResult {
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
}

export function buildLabaRugi(
  accounts: AccountRow[],
  lines: JournalLineRow[],
  startDate: string,
  endDate: string,
): LabaRugiResult {
  const sumType = (type: AccountType) => {
    const ids = accounts.filter((a) => a.type === type).map((a) => a.id);
    let debit = 0;
    let credit = 0;
    for (const l of validLines(lines)) {
      if (!ids.includes(l.accountId)) continue;
      if (!inRange(l.date, startDate, endDate)) continue;
      debit += Number(l.debit) || 0;
      credit += Number(l.credit) || 0;
    }
    return { debit: round2(debit), credit: round2(credit) };
  };

  const rev = sumType("revenue");
  const exp = sumType("expense");

  const totalRevenue = round2(rev.credit - rev.debit);
  const totalExpense = round2(exp.debit - exp.credit);

  return {
    totalRevenue,
    totalExpense,
    netIncome: round2(totalRevenue - totalExpense),
  };
}

// ============================ ARUS KAS ============================

export interface CashFlowDetail {
  code: string;
  name: string;
  amount: number;
}

export interface ArusKasResult {
  openingCash: number;
  closingCash: number;
  operatingFlow: number;
  investingFlow: number;
  financingFlow: number;
  netChange: number;
  operatingDetails: CashFlowDetail[];
  investingDetails: CashFlowDetail[];
  financingDetails: CashFlowDetail[];
}

/** Kode akun kas & setara kas (sesuai implementasi Laravel). */
export const CASH_CODES = ["111", "112"];
const CASH_AND_RELATED_CODES = ["111", "112", "113", "114", "115"];
const WORKING_CAPITAL_CODES = ["113", "114", "211", "212"];

/** Saldo kas sampai tanggal tertentu (akun asset berkode 111/112). */
function cashBalanceUntil(
  accounts: AccountRow[],
  lines: JournalLineRow[],
  asOfDate: string,
): number {
  let total = 0;
  for (const a of accounts.filter((x) => x.type === "asset" && CASH_CODES.includes(x.code))) {
    const { debit, credit } = sumForAccount(lines, a.id, undefined, asOfDate);
    total += balanceFrom(a.type, a.initialBalance, debit, credit);
  }
  return round2(total);
}

function previousDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function buildArusKas(
  accounts: AccountRow[],
  lines: JournalLineRow[],
  startDate: string,
  endDate: string,
): ArusKasResult {
  const openingCash = cashBalanceUntil(accounts, lines, previousDay(startDate));
  const closingCash = cashBalanceUntil(accounts, lines, endDate);

  const flowOf = (a: AccountRow) => {
    const { debit, credit } = sumForAccount(lines, a.id, startDate, endDate);
    return round2(flowFrom(a.type, debit, credit));
  };

  // === OPERASI ===
  const operatingDetails: CashFlowDetail[] = [];
  let operatingFlow = 0;

  for (const a of accounts.filter((x) => x.type === "revenue")) {
    const f = flowOf(a);
    if (Math.abs(f) > 0) {
      operatingDetails.push({ code: a.code, name: a.name, amount: f });
      operatingFlow += f;
    }
  }
  for (const a of accounts.filter((x) => x.type === "expense")) {
    let f = flowOf(a);
    if (Math.abs(f) > 0) {
      f = -f; // beban = kas keluar
      operatingDetails.push({ code: a.code, name: a.name, amount: round2(f) });
      operatingFlow += f;
    }
  }
  for (const a of accounts.filter((x) => WORKING_CAPITAL_CODES.includes(x.code))) {
    let f = flowOf(a);
    if (Math.abs(f) > 0) {
      if (a.type === "asset") f = -f; // piutang/uang muka naik = kas turun
      operatingDetails.push({ code: a.code, name: a.name, amount: round2(f) });
      operatingFlow += f;
    }
  }

  // === INVESTASI ===
  const investingDetails: CashFlowDetail[] = [];
  let investingFlow = 0;
  for (const a of accounts.filter(
    (x) => x.type === "asset" && !CASH_AND_RELATED_CODES.includes(x.code),
  )) {
    let f = flowOf(a);
    if (Math.abs(f) > 0) {
      f = -f; // beli aset = kas keluar
      investingDetails.push({ code: a.code, name: a.name, amount: round2(f) });
      investingFlow += f;
    }
  }

  // === PENDANAAN ===
  const financingDetails: CashFlowDetail[] = [];
  let financingFlow = 0;
  for (const a of accounts.filter((x) => x.type === "equity")) {
    const f = flowOf(a);
    if (Math.abs(f) > 0) {
      financingDetails.push({ code: a.code, name: a.name, amount: f });
      financingFlow += f;
    }
  }

  operatingFlow = round2(operatingFlow);
  investingFlow = round2(investingFlow);
  financingFlow = round2(financingFlow);

  return {
    openingCash,
    closingCash,
    operatingFlow,
    investingFlow,
    financingFlow,
    netChange: round2(operatingFlow + investingFlow + financingFlow),
    operatingDetails,
    investingDetails,
    financingDetails,
  };
}
