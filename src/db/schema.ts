/**
 * Skema database (Drizzle ORM / PostgreSQL).
 * Port dari migrasi Laravel di project `accounting`.
 *
 * PGlite adalah PostgreSQL asli (WASM) — jadi skema & query di sini
 * kompatibel penuh bila nanti ditukar ke server PostgreSQL sungguhan.
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  date,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("staff"), // admin | staff
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    // asset | liability | equity | revenue | expense
    type: varchar("type", { length: 20 }).notNull(),
    initialBalance: numeric("initial_balance", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("accounts_type_idx").on(t.type)],
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    referenceNumber: varchar("reference_number", { length: 255 }).notNull(),
    date: date("date").notNull(),
    description: text("description"),
    sourceType: varchar("source_type", { length: 50 }),
    sourceId: integer("source_id"),
    isPosted: boolean("is_posted").notNull().default(false),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("journal_entries_date_idx").on(t.date),
    index("journal_entries_source_idx").on(t.sourceType, t.sourceId),
  ],
);

export const journalEntryLines = pgTable(
  "journal_entry_lines",
  {
    id: serial("id").primaryKey(),
    journalEntryId: integer("journal_entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    debit: numeric("debit", { precision: 15, scale: 2 }).notNull().default("0"),
    credit: numeric("credit", { precision: 15, scale: 2 }).notNull().default("0"),
    description: varchar("description", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("journal_lines_account_idx").on(t.accountId),
    index("journal_lines_entry_idx").on(t.journalEntryId),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type AccountRowDb = typeof accounts.$inferSelect;
export type JournalEntryRow = typeof journalEntries.$inferSelect;
export type JournalEntryLineRow = typeof journalEntryLines.$inferSelect;

// ============================ Master data ============================

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 100 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  price: numeric("price", { precision: 15, scale: 2 }).notNull().default("0"),
  stock: integer("stock").notNull().default(0),
  trackStock: boolean("track_stock").notNull().default(true),
  description: text("description"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================ Invoice ============================

export const customerInvoices = pgTable(
  "customer_invoices",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date"),
    taxPercentage: numeric("tax_percentage", { precision: 5, scale: 2 }).notNull().default("0"),
    taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    status: varchar("status", { length: 20 }).notNull().default("unpaid"), // unpaid | paid
    notes: text("notes"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("customer_invoices_customer_idx").on(t.customerId)],
);

export const customerInvoiceLines = pgTable(
  "customer_invoice_lines",
  {
    id: serial("id").primaryKey(),
    customerInvoiceId: integer("customer_invoice_id")
      .notNull()
      .references(() => customerInvoices.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    description: varchar("description", { length: 255 }),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull().default("0"),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("customer_invoice_lines_invoice_idx").on(t.customerInvoiceId)],
);

export const supplierInvoices = pgTable(
  "supplier_invoices",
  {
    id: serial("id").primaryKey(),
    vendorId: integer("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date"),
    taxPercentage: numeric("tax_percentage", { precision: 5, scale: 2 }).notNull().default("0"),
    taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    status: varchar("status", { length: 20 }).notNull().default("unpaid"),
    notes: text("notes"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("supplier_invoices_vendor_idx").on(t.vendorId)],
);

export const supplierInvoiceLines = pgTable(
  "supplier_invoice_lines",
  {
    id: serial("id").primaryKey(),
    supplierInvoiceId: integer("supplier_invoice_id")
      .notNull()
      .references(() => supplierInvoices.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    description: varchar("description", { length: 255 }),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull().default("0"),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("supplier_invoice_lines_invoice_idx").on(t.supplierInvoiceId)],
);

export type CustomerRow = typeof customers.$inferSelect;
export type VendorRow = typeof vendors.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type CustomerInvoiceRow = typeof customerInvoices.$inferSelect;
export type CustomerInvoiceLineRow = typeof customerInvoiceLines.$inferSelect;
export type SupplierInvoiceRow = typeof supplierInvoices.$inferSelect;
export type SupplierInvoiceLineRow = typeof supplierInvoiceLines.$inferSelect;
