/**
 * Query untuk master data & invoice.
 */

import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  customerInvoiceLines,
  customerInvoices,
  customers,
  journalEntries,
  journalEntryLines,
  products,
  supplierInvoiceLines,
  supplierInvoices,
  vendors,
} from "@/db/schema";
import type { AccountRow, JournalLineRow } from "./accounting/reports";
import type { AccountType } from "./accounting/balance";

// ============================ Akun & Jurnal ============================

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

/** Ambil semua baris jurnal yang sah (diposting & tidak di-soft-delete). */
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

// ============================ Master ============================

export interface MasterRow {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export async function getCustomers(): Promise<MasterRow[]> {
  return db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      address: customers.address,
    })
    .from(customers)
    .where(isNull(customers.deletedAt))
    .orderBy(customers.name);
}

export async function getVendors(): Promise<MasterRow[]> {
  return db
    .select({
      id: vendors.id,
      name: vendors.name,
      email: vendors.email,
      phone: vendors.phone,
      address: vendors.address,
    })
    .from(vendors)
    .where(isNull(vendors.deletedAt))
    .orderBy(vendors.name);
}

export interface ProductListRow {
  id: number;
  sku: string | null;
  name: string;
  price: number;
  stock: number;
  trackStock: boolean;
  description: string | null;
}

export async function getProducts(): Promise<ProductListRow[]> {
  const rows = await db
    .select()
    .from(products)
    .where(isNull(products.deletedAt))
    .orderBy(products.name);

  return rows.map((r) => ({
    id: r.id,
    sku: r.sku,
    name: r.name,
    price: Number(r.price),
    stock: r.stock,
    trackStock: r.trackStock,
    description: r.description,
  }));
}

// ============================ Invoice ============================

export interface InvoiceListRow {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  partyName: string;
  totalAmount: number;
  status: string;
  lineCount: number;
}

export async function getCustomerInvoices(): Promise<InvoiceListRow[]> {
  const rows = await db
    .select({
      id: customerInvoices.id,
      invoiceNumber: customerInvoices.invoiceNumber,
      invoiceDate: customerInvoices.invoiceDate,
      dueDate: customerInvoices.dueDate,
      partyName: customers.name,
      totalAmount: customerInvoices.totalAmount,
      status: customerInvoices.status,
      lineCount: sql<string>`COUNT(${customerInvoiceLines.id})`,
    })
    .from(customerInvoices)
    .innerJoin(customers, eq(customerInvoices.customerId, customers.id))
    .leftJoin(
      customerInvoiceLines,
      eq(customerInvoiceLines.customerInvoiceId, customerInvoices.id),
    )
    .where(isNull(customerInvoices.deletedAt))
    .groupBy(
      customerInvoices.id,
      customerInvoices.invoiceNumber,
      customerInvoices.invoiceDate,
      customerInvoices.dueDate,
      customers.name,
      customerInvoices.totalAmount,
      customerInvoices.status,
    )
    .orderBy(desc(customerInvoices.invoiceDate), desc(customerInvoices.id));

  return rows.map(toListRow);
}

export async function getSupplierInvoices(): Promise<InvoiceListRow[]> {
  const rows = await db
    .select({
      id: supplierInvoices.id,
      invoiceNumber: supplierInvoices.invoiceNumber,
      invoiceDate: supplierInvoices.invoiceDate,
      dueDate: supplierInvoices.dueDate,
      partyName: vendors.name,
      totalAmount: supplierInvoices.totalAmount,
      status: supplierInvoices.status,
      lineCount: sql<string>`COUNT(${supplierInvoiceLines.id})`,
    })
    .from(supplierInvoices)
    .innerJoin(vendors, eq(supplierInvoices.vendorId, vendors.id))
    .leftJoin(
      supplierInvoiceLines,
      eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoices.id),
    )
    .where(isNull(supplierInvoices.deletedAt))
    .groupBy(
      supplierInvoices.id,
      supplierInvoices.invoiceNumber,
      supplierInvoices.invoiceDate,
      supplierInvoices.dueDate,
      vendors.name,
      supplierInvoices.totalAmount,
      supplierInvoices.status,
    )
    .orderBy(desc(supplierInvoices.invoiceDate), desc(supplierInvoices.id));

  return rows.map(toListRow);
}

function toListRow(r: {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  partyName: string;
  totalAmount: string;
  status: string;
  lineCount: string;
}): InvoiceListRow {
  return {
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    invoiceDate: typeof r.invoiceDate === "string" ? r.invoiceDate : String(r.invoiceDate),
    dueDate: r.dueDate ? (typeof r.dueDate === "string" ? r.dueDate : String(r.dueDate)) : null,
    partyName: r.partyName,
    totalAmount: Number(r.totalAmount),
    status: r.status,
    lineCount: Number(r.lineCount),
  };
}

export interface InvoiceDetail {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  partyName: string;
  partyPhone: string | null;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  notes: string | null;
  lines: {
    id: number;
    productName: string | null;
    description: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export async function getCustomerInvoice(id: number): Promise<InvoiceDetail | null> {
  const [inv] = await db
    .select({
      id: customerInvoices.id,
      invoiceNumber: customerInvoices.invoiceNumber,
      invoiceDate: customerInvoices.invoiceDate,
      dueDate: customerInvoices.dueDate,
      partyName: customers.name,
      partyPhone: customers.phone,
      taxPercentage: customerInvoices.taxPercentage,
      taxAmount: customerInvoices.taxAmount,
      totalAmount: customerInvoices.totalAmount,
      status: customerInvoices.status,
      notes: customerInvoices.notes,
    })
    .from(customerInvoices)
    .innerJoin(customers, eq(customerInvoices.customerId, customers.id))
    .where(and(eq(customerInvoices.id, id), isNull(customerInvoices.deletedAt)))
    .limit(1);

  if (!inv) return null;

  const lines = await db
    .select({
      id: customerInvoiceLines.id,
      productName: products.name,
      description: customerInvoiceLines.description,
      quantity: customerInvoiceLines.quantity,
      unitPrice: customerInvoiceLines.unitPrice,
      subtotal: customerInvoiceLines.subtotal,
    })
    .from(customerInvoiceLines)
    .leftJoin(products, eq(customerInvoiceLines.productId, products.id))
    .where(eq(customerInvoiceLines.customerInvoiceId, id))
    .orderBy(customerInvoiceLines.id);

  return mapDetail(inv, lines);
}

export async function getSupplierInvoice(id: number): Promise<InvoiceDetail | null> {
  const [inv] = await db
    .select({
      id: supplierInvoices.id,
      invoiceNumber: supplierInvoices.invoiceNumber,
      invoiceDate: supplierInvoices.invoiceDate,
      dueDate: supplierInvoices.dueDate,
      partyName: vendors.name,
      partyPhone: vendors.phone,
      taxPercentage: supplierInvoices.taxPercentage,
      taxAmount: supplierInvoices.taxAmount,
      totalAmount: supplierInvoices.totalAmount,
      status: supplierInvoices.status,
      notes: supplierInvoices.notes,
    })
    .from(supplierInvoices)
    .innerJoin(vendors, eq(supplierInvoices.vendorId, vendors.id))
    .where(and(eq(supplierInvoices.id, id), isNull(supplierInvoices.deletedAt)))
    .limit(1);

  if (!inv) return null;

  const lines = await db
    .select({
      id: supplierInvoiceLines.id,
      productName: products.name,
      description: supplierInvoiceLines.description,
      quantity: supplierInvoiceLines.quantity,
      unitPrice: supplierInvoiceLines.unitPrice,
      subtotal: supplierInvoiceLines.subtotal,
    })
    .from(supplierInvoiceLines)
    .leftJoin(products, eq(supplierInvoiceLines.productId, products.id))
    .where(eq(supplierInvoiceLines.supplierInvoiceId, id))
    .orderBy(supplierInvoiceLines.id);

  return mapDetail(inv, lines);
}

function mapDetail(
  inv: {
    id: number;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string | null;
    partyName: string;
    taxPercentage: string;
    taxAmount: string;
    totalAmount: string;
    status: string;
    notes: string | null;
    partyPhone?: string | null;
  },
  lines: {
    id: number;
    productName: string | null;
    description: string | null;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  }[],
): InvoiceDetail {
  const asDate = (d: string | null) =>
    d ? (typeof d === "string" ? d : String(d)) : null;

  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: asDate(inv.invoiceDate)!,
    dueDate: asDate(inv.dueDate),
    partyName: inv.partyName,
    partyPhone: inv.partyPhone ?? null,
    taxPercentage: Number(inv.taxPercentage),
    taxAmount: Number(inv.taxAmount),
    totalAmount: Number(inv.totalAmount),
    status: inv.status,
    notes: inv.notes,
    lines: lines.map((l) => ({
      id: l.id,
      productName: l.productName,
      description: l.description,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice),
      subtotal: Number(l.subtotal),
    })),
  };
}
