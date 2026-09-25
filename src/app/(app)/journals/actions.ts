"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { journalEntries, journalEntryLines } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { validateJournal, JournalValidationError } from "@/lib/accounting/journal";
import { round2 } from "@/lib/accounting/balance";

export interface JournalState {
  error?: string;
  success?: string;
}

interface LinePayload {
  accountId: number;
  debit: number;
  credit: number;
  description?: string;
}

/**
 * Simpan jurnal manual.
 *
 * Data dikirim sebagai JSON di field `payload` karena jumlah baris dinamis.
 * Validasi memakai validateJournal() — rumus yang sama dipakai unit test.
 */
export async function createJournal(
  _prev: JournalState,
  formData: FormData,
): Promise<JournalState> {
  await requireUser();

  const raw = String(formData.get("payload") ?? "");
  let payload: {
    referenceNumber: string;
    date: string;
    description?: string;
    lines: LinePayload[];
  };

  try {
    payload = JSON.parse(raw);
  } catch {
    return { error: "Data jurnal tidak valid." };
  }

  // Buang baris yang benar-benar kosong (belum diisi apa pun).
  const lines = (payload.lines ?? []).filter(
    (l) => l.accountId || Number(l.debit) || Number(l.credit),
  );

  try {
    validateJournal({ ...payload, lines });
  } catch (e) {
    if (e instanceof JournalValidationError) return { error: e.message };
    throw e;
  }

  const totalDebit = round2(lines.reduce((s, l) => s + (Number(l.debit) || 0), 0));

  await db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(journalEntries)
      .values({
        referenceNumber: payload.referenceNumber.trim(),
        date: payload.date,
        description: payload.description?.trim() || null,
        sourceType: "manual",
        isPosted: true,
        postedAt: new Date(),
      })
      .returning({ id: journalEntries.id });

    await tx.insert(journalEntryLines).values(
      lines.map((l) => ({
        journalEntryId: entry.id,
        accountId: Number(l.accountId),
        debit: String(round2(Number(l.debit) || 0)),
        credit: String(round2(Number(l.credit) || 0)),
        description: l.description?.trim() || null,
      })),
    );

    void totalDebit;
  });

  revalidatePath("/journals");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  return { success: `Jurnal ${payload.referenceNumber} berhasil disimpan.` };
}
