import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at").defaultNow().notNull();
const createdBy = () =>
  text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" });

export const pageStatusEnum = pgEnum("page_status", ["open", "closed"]);
export const entryTypeEnum = pgEnum("entry_type", ["in", "out"]);

export const paymentMethod = pgTable("payment_method", {
  id: id(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: createdBy(),
  createdAt: createdAt(),
});

export const game = pgTable("game", {
  id: id(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: createdBy(),
  createdAt: createdAt(),
});

export const customer = pgTable(
  "customer",
  {
    id: id(),
    name: text("name").notNull(),
    phone: text("phone"),
    /** Public URL of the avatar in the Supabase Storage bucket */
    imageUrl: text("image_url"),
    /** Facebook profile link */
    profileUrl: text("profile_url"),
    createdBy: createdBy(),
    createdAt: createdAt(),
  },
  (t) => [index("customer_name_idx").on(t.name)],
);

export const ledgerPage = pgTable(
  "ledger_page",
  {
    id: id(),
    title: text("title").notNull(),
    status: pageStatusEnum("status").default("open").notNull(),
    openedAt: timestamp("opened_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
    closedBy: text("closed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdBy: createdBy(),
  },
  (t) => [index("ledger_page_status_idx").on(t.status, t.openedAt)],
);

export const entry = pgTable(
  "entry",
  {
    id: id(),
    ledgerPageId: text("ledger_page_id")
      .notNull()
      .references(() => ledgerPage.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "restrict" }),
    type: entryTypeEnum("type").notNull(),
    amountCents: integer("amount_cents").notNull(),
    paymentMethodId: text("payment_method_id")
      .notNull()
      .references(() => paymentMethod.id, { onDelete: "restrict" }),
    createdBy: createdBy(),
    createdAt: createdAt(),
  },
  (t) => [
    index("entry_page_idx").on(t.ledgerPageId, t.createdAt),
    index("entry_customer_idx").on(t.customerId),
    check("entry_amount_positive", sql`${t.amountCents} > 0`),
  ],
);

/** An entry can cover several games played from one payment. */
export const entryGame = pgTable(
  "entry_game",
  {
    entryId: text("entry_id")
      .notNull()
      .references(() => entry.id, { onDelete: "cascade" }),
    gameId: text("game_id")
      .notNull()
      .references(() => game.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.entryId, t.gameId] }),
    index("entry_game_game_idx").on(t.gameId),
  ],
);

export const expense = pgTable(
  "expense",
  {
    id: id(),
    ledgerPageId: text("ledger_page_id")
      .notNull()
      .references(() => ledgerPage.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull(),
    paymentMethodId: text("payment_method_id").references(
      () => paymentMethod.id,
      { onDelete: "restrict" },
    ),
    createdBy: createdBy(),
    createdAt: createdAt(),
  },
  (t) => [
    index("expense_page_idx").on(t.ledgerPageId),
    check("expense_amount_positive", sql`${t.amountCents} > 0`),
  ],
);
