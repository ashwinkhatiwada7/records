import { defineRelations } from "drizzle-orm";
import * as schema from "./schema/index";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
  },
  session: {
    user: r.one.user({ from: r.session.userId, to: r.user.id }),
  },
  account: {
    user: r.one.user({ from: r.account.userId, to: r.user.id }),
  },
  ledgerPage: {
    entries: r.many.entry(),
    expenses: r.many.expense(),
    creator: r.one.user({ from: r.ledgerPage.createdBy, to: r.user.id }),
    closer: r.one.user({ from: r.ledgerPage.closedBy, to: r.user.id }),
  },
  customer: {
    entries: r.many.entry(),
  },
  paymentMethod: {
    entries: r.many.entry(),
    expenses: r.many.expense(),
  },
  game: {
    entryGames: r.many.entryGame(),
  },
  entryGame: {
    entry: r.one.entry({ from: r.entryGame.entryId, to: r.entry.id }),
    game: r.one.game({ from: r.entryGame.gameId, to: r.game.id }),
  },
  entry: {
    page: r.one.ledgerPage({
      from: r.entry.ledgerPageId,
      to: r.ledgerPage.id,
    }),
    customer: r.one.customer({ from: r.entry.customerId, to: r.customer.id }),
    paymentMethod: r.one.paymentMethod({
      from: r.entry.paymentMethodId,
      to: r.paymentMethod.id,
    }),
    games: r.many.entryGame(),
    creator: r.one.user({ from: r.entry.createdBy, to: r.user.id }),
  },
  expense: {
    page: r.one.ledgerPage({
      from: r.expense.ledgerPageId,
      to: r.ledgerPage.id,
    }),
    paymentMethod: r.one.paymentMethod({
      from: r.expense.paymentMethodId,
      to: r.paymentMethod.id,
    }),
    creator: r.one.user({ from: r.expense.createdBy, to: r.user.id }),
  },
}));
