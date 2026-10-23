"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { entry, entryGame, expense, ledgerPage } from "@/db/schema";
import { ActionError, requireAdmin, requireUser, runAction } from "@/lib/authz";
import { toCents } from "@/lib/money";
import {
  entrySchema,
  expenseSchema,
  pageSchema,
  type EntryValues,
  type ExpenseValues,
  type PageValues,
} from "@/lib/validations";

async function assertOpen(pageId: string) {
  const [page] = await db
    .select({ status: ledgerPage.status })
    .from(ledgerPage)
    .where(eq(ledgerPage.id, pageId))
    .limit(1);
  if (!page) throw new ActionError("Page not found");
  if (page.status !== "open") {
    throw new ActionError("This page is closed. An admin must reopen it first.");
  }
}

export async function createPage(values: PageValues) {
  return runAction(async () => {
    const user = await requireUser();
    const parsed = pageSchema.safeParse(values);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0].message);

    const [created] = await db
      .insert(ledgerPage)
      .values({ ...parsed.data, createdBy: user.id })
      .returning({ id: ledgerPage.id });

    revalidatePath("/dashboard");
    return { id: created.id };
  });
}

export async function addEntry(values: EntryValues) {
  return runAction(async () => {
    const user = await requireUser();
    const parsed = entrySchema.safeParse(values);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0].message);
    const { amount, gameIds, pageId, type, ...rest } = parsed.data;

    await assertOpen(pageId);
    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(entry)
        .values({
          ...rest,
          type,
          ledgerPageId: pageId,
          amountCents: toCents(amount),
          createdBy: user.id,
        })
        .returning({ id: entry.id });

      // games only apply to payments in
      const games = type === "in" ? [...new Set(gameIds)] : [];
      if (games.length) {
        await tx
          .insert(entryGame)
          .values(games.map((gameId) => ({ entryId: created.id, gameId })));
      }
    });

    revalidatePath(`/dashboard/pages/${pageId}`, "layout");
    revalidatePath("/dashboard");
  });
}

export async function addExpense(values: ExpenseValues) {
  return runAction(async () => {
    const user = await requireUser();
    const parsed = expenseSchema.safeParse(values);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0].message);
    const { amount, paymentMethodId, pageId, ...rest } = parsed.data;

    await assertOpen(pageId);
    await db.insert(expense).values({
      ...rest,
      ledgerPageId: pageId,
      paymentMethodId: paymentMethodId || null,
      amountCents: toCents(amount),
      createdBy: user.id,
    });

    revalidatePath(`/dashboard/pages/${pageId}`, "layout");
    revalidatePath("/dashboard");
  });
}

/** Any signed-in user can close a page. */
export async function closePage(pageId: string) {
  return runAction(async () => {
    const user = await requireUser();
    const updated = await db
      .update(ledgerPage)
      .set({ status: "closed", closedAt: new Date(), closedBy: user.id })
      .where(and(eq(ledgerPage.id, pageId), eq(ledgerPage.status, "open")))
      .returning({ id: ledgerPage.id });
    if (!updated.length) throw new ActionError("Page is already closed");

    revalidatePath(`/dashboard/pages/${pageId}`, "layout");
    revalidatePath("/dashboard");
  });
}

export async function reopenPage(pageId: string) {
  return runAction(async () => {
    await requireAdmin();
    await db
      .update(ledgerPage)
      .set({ status: "open", closedAt: null, closedBy: null })
      .where(eq(ledgerPage.id, pageId));

    revalidatePath(`/dashboard/pages/${pageId}`, "layout");
    revalidatePath("/dashboard");
  });
}

export async function deleteEntry(id: string) {
  return runAction(async () => {
    await requireAdmin();
    const [row] = await db
      .delete(entry)
      .where(eq(entry.id, id))
      .returning({ pageId: entry.ledgerPageId });
    if (row) revalidatePath(`/dashboard/pages/${row.pageId}`, "layout");
    revalidatePath("/dashboard");
  });
}

export async function deleteExpense(id: string) {
  return runAction(async () => {
    await requireAdmin();
    const [row] = await db
      .delete(expense)
      .where(eq(expense.id, id))
      .returning({ pageId: expense.ledgerPageId });
    if (row) revalidatePath(`/dashboard/pages/${row.pageId}`, "layout");
    revalidatePath("/dashboard");
  });
}

/** Admin only. Entries, expenses and their game links are removed by the DB cascade. */
export async function deletePage(pageId: string) {
  return runAction(async () => {
    await requireAdmin();
    const deleted = await db
      .delete(ledgerPage)
      .where(eq(ledgerPage.id, pageId))
      .returning({ id: ledgerPage.id });
    if (!deleted.length) throw new ActionError("Page not found");
    revalidatePath("/dashboard", "layout");
  });
}
