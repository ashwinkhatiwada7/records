import "server-only";
import { cache } from "react";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import {
  customer,
  entry,
  entryGame,
  expense,
  game,
  ledgerPage,
  paymentMethod,
  user,
} from "@/db/schema";
import { likePattern } from "./params";

export type Paged = { page: number; pageSize: number; q: string };

const num = (expr: SQL) => sql<number>`coalesce(${expr}, 0)::float8`.mapWith(Number);

async function paged<T>(
  rows: (limit: number, offset: number) => Promise<T[]>,
  total: () => Promise<number>,
  { page, pageSize }: Paged,
) {
  const [data, totalRows] = await Promise.all([
    rows(pageSize, (page - 1) * pageSize),
    total(),
  ]);
  return { rows: data, total: totalRows };
}

// ---- ledger pages ---------------------------------------------------------

const pageTotals = {
  totalIn: num(
    sql`(select sum(${entry.amountCents}) from ${entry} where ${entry.ledgerPageId} = ${ledgerPage.id} and ${entry.type} = 'in')`,
  ),
  totalOut: num(
    sql`(select sum(${entry.amountCents}) from ${entry} where ${entry.ledgerPageId} = ${ledgerPage.id} and ${entry.type} = 'out')`,
  ),
  totalExpense: num(
    sql`(select sum(${expense.amountCents}) from ${expense} where ${expense.ledgerPageId} = ${ledgerPage.id})`,
  ),
};

export async function listPages(p: Paged & { status?: string }) {
  const where = and(
    p.q ? ilike(ledgerPage.title, likePattern(p.q)) : undefined,
    p.status === "open" || p.status === "closed"
      ? eq(ledgerPage.status, p.status)
      : undefined,
  );
  return paged(
    (limit, offset) =>
      db
        .select({
          id: ledgerPage.id,
          title: ledgerPage.title,
          status: ledgerPage.status,
          openedAt: ledgerPage.openedAt,
          closedAt: ledgerPage.closedAt,
          ...pageTotals,
        })
        .from(ledgerPage)
        .where(where)
        .orderBy(desc(ledgerPage.openedAt))
        .limit(limit)
        .offset(offset),
    async () => (await db.select({ n: count() }).from(ledgerPage).where(where))[0].n,
    p,
  );
}

export const getPage = cache(async (id: string) => {
  const [row] = await db
    .select({
      id: ledgerPage.id,
      title: ledgerPage.title,
      status: ledgerPage.status,
      openedAt: ledgerPage.openedAt,
      closedAt: ledgerPage.closedAt,
      closedByName: user.name,
    })
    .from(ledgerPage)
    .leftJoin(user, eq(user.id, ledgerPage.closedBy))
    .where(eq(ledgerPage.id, id))
    .limit(1);
  return row;
});

export async function getPageMetrics(pageId: string) {
  const inAmount = sql`case when ${entry.type} = 'in' then ${entry.amountCents} else 0 end`;
  const outAmount = sql`case when ${entry.type} = 'out' then ${entry.amountCents} else 0 end`;
  // one payment can cover several games: split its amount evenly between them
  const gameShare = sql`${entry.amountCents}::float8 / (select count(*) from ${entryGame} x where x.entry_id = ${entry.id})`;

  const [[totals], [exp], topCustomers, topGames, byMethod] = await Promise.all([
    db
      .select({
        totalIn: num(sql`sum(${inAmount})`),
        totalOut: num(sql`sum(${outAmount})`),
        entries: count(),
      })
      .from(entry)
      .where(eq(entry.ledgerPageId, pageId)),
    db
      .select({ totalExpense: num(sql`sum(${expense.amountCents})`), n: count() })
      .from(expense)
      .where(eq(expense.ledgerPageId, pageId)),
    db
      .select({
        id: customer.id,
        name: customer.name,
        imageUrl: customer.imageUrl,
        totalIn: num(sql`sum(${inAmount})`),
        totalOut: num(sql`sum(${outAmount})`),
      })
      .from(entry)
      .innerJoin(customer, eq(customer.id, entry.customerId))
      .where(eq(entry.ledgerPageId, pageId))
      .groupBy(customer.id, customer.name, customer.imageUrl)
      .having(sql`sum(${inAmount}) > 0`)
      .orderBy(desc(sql`sum(${inAmount})`))
      .limit(5),
    db
      .select({
        id: game.id,
        name: game.name,
        plays: count(),
        totalIn: num(sql`sum(${gameShare})`),
      })
      .from(entryGame)
      .innerJoin(entry, eq(entry.id, entryGame.entryId))
      .innerJoin(game, eq(game.id, entryGame.gameId))
      .where(and(eq(entry.ledgerPageId, pageId), eq(entry.type, "in")))
      .groupBy(game.id, game.name)
      .orderBy(desc(count()), desc(sql`sum(${gameShare})`))
      .limit(5),
    db
      .select({
        id: paymentMethod.id,
        name: paymentMethod.name,
        totalIn: num(sql`sum(${inAmount})`),
        totalOut: num(sql`sum(${outAmount})`),
      })
      .from(entry)
      .innerJoin(paymentMethod, eq(paymentMethod.id, entry.paymentMethodId))
      .where(eq(entry.ledgerPageId, pageId))
      .groupBy(paymentMethod.id, paymentMethod.name)
      .orderBy(desc(sql`sum(${inAmount}) + sum(${outAmount})`)),
  ]);

  return {
    totalIn: totals.totalIn,
    totalOut: totals.totalOut,
    totalExpense: exp.totalExpense,
    profit: totals.totalIn - totals.totalOut - exp.totalExpense,
    entryCount: totals.entries,
    expenseCount: exp.n,
    topCustomers,
    topGames,
    byMethod,
  };
}

// ---- entries and expenses of a page ----------------------------------------

export async function listEntries(
  pageId: string,
  p: Paged & { type?: string },
) {
  const where = and(
    eq(entry.ledgerPageId, pageId),
    p.type === "in" || p.type === "out" ? eq(entry.type, p.type) : undefined,
    p.q
      ? or(
          ilike(customer.name, likePattern(p.q)),
          sql`exists (select 1 from ${entryGame} eg join ${game} g on g.id = eg.game_id where eg.entry_id = ${entry.id} and g.name ilike ${likePattern(p.q)})`,
        )
      : undefined,
  );
  return paged(
    (limit, offset) =>
      db
        .select({
          id: entry.id,
          type: entry.type,
          amountCents: entry.amountCents,
          createdAt: entry.createdAt,
          addedBy: user.name,
          customerName: customer.name,
          customerImageUrl: customer.imageUrl,
          methodName: paymentMethod.name,
          gameNames: sql<string[]>`coalesce((select json_agg(g.name order by g.name) from ${entryGame} eg join ${game} g on g.id = eg.game_id where eg.entry_id = ${entry.id}), '[]'::json)`,
        })
        .from(entry)
        .innerJoin(customer, eq(customer.id, entry.customerId))
        .innerJoin(paymentMethod, eq(paymentMethod.id, entry.paymentMethodId))
        .innerJoin(user, eq(user.id, entry.createdBy))
        .where(where)
        .orderBy(desc(entry.createdAt))
        .limit(limit)
        .offset(offset),
    async () =>
      (
        await db
          .select({ n: count() })
          .from(entry)
          .innerJoin(customer, eq(customer.id, entry.customerId))
          .where(where)
      )[0].n,
    p,
  );
}

export async function listExpenses(pageId: string, p: Paged) {
  const where = and(
    eq(expense.ledgerPageId, pageId),
    p.q ? ilike(expense.description, likePattern(p.q)) : undefined,
  );
  return paged(
    (limit, offset) =>
      db
        .select({
          id: expense.id,
          description: expense.description,
          amountCents: expense.amountCents,
          createdAt: expense.createdAt,
          addedBy: user.name,
          methodName: paymentMethod.name,
        })
        .from(expense)
        .leftJoin(paymentMethod, eq(paymentMethod.id, expense.paymentMethodId))
        .innerJoin(user, eq(user.id, expense.createdBy))
        .where(where)
        .orderBy(desc(expense.createdAt))
        .limit(limit)
        .offset(offset),
    async () => (await db.select({ n: count() }).from(expense).where(where))[0].n,
    p,
  );
}

// ---- customers, games, payment methods, users ------------------------------

export async function listCustomers(p: Paged) {
  const where = p.q
    ? or(ilike(customer.name, likePattern(p.q)), ilike(customer.phone, likePattern(p.q)))
    : undefined;
  return paged(
    (limit, offset) =>
      db
        .select({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          imageUrl: customer.imageUrl,
          profileUrl: customer.profileUrl,
          createdAt: customer.createdAt,
        })
        .from(customer)
        .where(where)
        .orderBy(desc(customer.createdAt))
        .limit(limit)
        .offset(offset),
    async () => (await db.select({ n: count() }).from(customer).where(where))[0].n,
    p,
  );
}

export async function listGames(p: Paged) {
  const where = p.q ? ilike(game.name, likePattern(p.q)) : undefined;
  return paged(
    (limit, offset) =>
      db
        .select({
          id: game.id,
          name: game.name,
          isActive: game.isActive,
          plays: num(sql`(select count(*) from ${entryGame} where ${entryGame.gameId} = ${game.id})`),
        })
        .from(game)
        .where(where)
        .orderBy(game.name)
        .limit(limit)
        .offset(offset),
    async () => (await db.select({ n: count() }).from(game).where(where))[0].n,
    p,
  );
}

export async function listPaymentMethods(p: Paged) {
  const where = p.q ? ilike(paymentMethod.name, likePattern(p.q)) : undefined;
  return paged(
    (limit, offset) =>
      db
        .select({
          id: paymentMethod.id,
          name: paymentMethod.name,
          isActive: paymentMethod.isActive,
          uses: num(
            sql`(select count(*) from ${entry} where ${entry.paymentMethodId} = ${paymentMethod.id})`,
          ),
        })
        .from(paymentMethod)
        .where(where)
        .orderBy(paymentMethod.name)
        .limit(limit)
        .offset(offset),
    async () => (await db.select({ n: count() }).from(paymentMethod).where(where))[0].n,
    p,
  );
}

export async function listAppUsers(p: Paged) {
  const where = p.q
    ? or(ilike(user.name, likePattern(p.q)), ilike(user.email, likePattern(p.q)))
    : undefined;
  return paged(
    (limit, offset) =>
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(where)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset),
    async () => (await db.select({ n: count() }).from(user).where(where))[0].n,
    p,
  );
}

/** Dropdown options for the entry form. */
export async function getEntryFormOptions() {
  const [customers, methods, games] = await Promise.all([
    db
      .select({ id: customer.id, name: customer.name, imageUrl: customer.imageUrl })
      .from(customer)
      .orderBy(customer.name)
      .limit(2000),
    db
      .select({ id: paymentMethod.id, name: paymentMethod.name })
      .from(paymentMethod)
      .where(eq(paymentMethod.isActive, true))
      .orderBy(paymentMethod.name),
    db
      .select({ id: game.id, name: game.name })
      .from(game)
      .where(eq(game.isActive, true))
      .orderBy(game.name),
  ]);
  return { customers, methods, games };
}
