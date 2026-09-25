/**
 * Lapisan query database — mengubah baris DB menjadi bentuk yang dipakai
 * fungsi laporan murni di src/lib/accounting/reports.ts.
 */

import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, journalEntries, journalEntryLines } from "@/db/schema";
import type { AccountRow, JournalLineRow } from "./accounting/reports";
import type { AccountType } from "./accounting/balance";

/** Ambil semua akun aktif (belum di-soft-delete). */
export async function getAccounts(): Promise<AccountRow[]> {
  const rows = await db
    .select()
    .from(accounts)
    .where(isNull(accounts.deletedAt))
    .orderBy(accounts.code);

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    type: r.type as AccountType,
    initialBalance: Number(r.initialBalance),
  }));
}

/**
 * Ambil semua baris jurnal yang sah (diposting & tidak di-soft-delete),
 * beserta tanggal jurnalnya.
 */
export async function getJournalLines(): Promise<JournalLineRow[]> {
  const rows = await db
    .select({
      accountId: journalEntryLines.accountId,
      debit: journalEntryLines.debit,
      credit: journalEntryLines.credit,
      date: journalEntries.date,
      isPosted: journalEntries.isPosted,
    })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .where(isNull(journalEntries.deletedAt));

  return rows.map((r) => ({
    accountId: r.accountId,
    debit: Number(r.debit),
    credit: Number(r.credit),
    date: typeof r.date === "string" ? r.date : String(r.date),
    isPosted: r.isPosted,
    deleted: false,
  }));
}

export interface JournalListRow {
  id: number;
  referenceNumber: string;
  date: string;
  description: string | null;
  isPosted: boolean;
  total: number;
  lineCount: number;
}

/** Daftar jurnal untuk halaman index. */
export async function getJournalEntries(): Promise<JournalListRow[]> {
  const rows = await db
    .select({
      id: journalEntries.id,
      referenceNumber: journalEntries.referenceNumber,
      date: journalEntries.date,
      description: journalEntries.description,
      isPosted: journalEntries.isPosted,
      total: sql<string>`COALESCE(SUM(${journalEntryLines.debit}), 0)`,
      lineCount: sql<string>`COUNT(${journalEntryLines.id})`,
    })
    .from(journalEntries)
    .leftJoin(journalEntryLines, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .where(isNull(journalEntries.deletedAt))
    .groupBy(
      journalEntries.id,
      journalEntries.referenceNumber,
      journalEntries.date,
      journalEntries.description,
      journalEntries.isPosted,
    )
    .orderBy(journalEntries.date, journalEntries.id);

  return rows.map((r) => ({
    id: r.id,
    referenceNumber: r.referenceNumber,
    date: typeof r.date === "string" ? r.date : String(r.date),
    description: r.description,
    isPosted: r.isPosted,
    total: Number(r.total),
    lineCount: Number(r.lineCount),
  }));
}

/** Detail satu jurnal beserta barisnya. */
export async function getJournalEntry(id: number) {
  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.id, id), isNull(journalEntries.deletedAt)))
    .limit(1);

  if (!entry) return null;

  const lines = await db
    .select({
      id: journalEntryLines.id,
      accountId: journalEntryLines.accountId,
      accountCode: accounts.code,
      accountName: accounts.name,
      debit: journalEntryLines.debit,
      credit: journalEntryLines.credit,
      description: journalEntryLines.description,
    })
    .from(journalEntryLines)
    .innerJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
    .where(eq(journalEntryLines.journalEntryId, id))
    .orderBy(journalEntryLines.id);

  return {
    ...entry,
    date: typeof entry.date === "string" ? entry.date : String(entry.date),
    lines: lines.map((l) => ({
      ...l,
      debit: Number(l.debit),
      credit: Number(l.credit),
    })),
  };
}
