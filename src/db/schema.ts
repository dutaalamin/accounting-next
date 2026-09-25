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
