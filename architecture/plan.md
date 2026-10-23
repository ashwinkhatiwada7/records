# Records: project plan

Source: `architecture/project-overview.md`. A daily payment ledger. Money comes **in** (customers pay via Cash App, Chime or PayPal), goes **out** (payouts) and is spent on **expenses**. All entries belong to a **ledger page**. When the books are settled, the page is **closed**. A new page is then started.

Profit of a page = total in − total out − total expenses.

## Roles

| Action | user | admin |
| --- | :-: | :-: |
| Sign in, view everything | yes | yes |
| Create ledger page | yes | yes |
| Add entry (in / out) and expense to an **open** page | yes | yes |
| Close a page | yes | yes |
| **Reopen** a closed page | no | yes |
| Edit / delete entries and expenses | no | **delete** |
| Delete a whole page (with all its entries and expenses) | no | yes |
| Delete a customer (only when they have no entries) | no | yes |
| Create customers, games, payment methods | yes | yes |
| Rename / disable / delete games and payment methods | no | yes |
| Create app users (and set role) | no | yes |

Rules enforced **on the server** in every server action (`lib/authz.ts`), never only in the UI. Nobody can add entries to a closed page, admin included, so they reopen it first.

## Database design

Money is stored as integer **cents** (`amount_cents`) to avoid float errors. IDs are text UUIDs, like the Better Auth tables.

```
user (Better Auth) ──< ledger_page ──< entry >── customer
        │                  │            │  └──> payment_method
        │                  └──< expense │  └──> game (nullable)
        └── created_by / closed_by on every row below
```

| Table | Columns |
| --- | --- |
| `payment_method` | id, name (unique), is_active, created_by → user, created_at |
| `game` | id, name (unique), is_active, created_by → user, created_at |
| `customer` | id, name, phone?, image_url? (Supabase Storage), profile_url? (Facebook), created_by → user, created_at |
| `ledger_page` | id, title, status (`open`/`closed`), opened_at, closed_at?, closed_by? → user, created_by → user |
| `entry` | id, ledger_page_id → ledger_page, customer_id → customer, type (`in`/`out`), amount_cents (> 0), payment_method_id → payment_method, created_by → user, created_at |
| `entry_game` | entry_id → entry (cascade), game_id → game; primary key (entry_id, game_id). One payment can cover several games; required for `in` |
| `expense` | id, ledger_page_id → ledger_page, description, amount_cents (> 0), payment_method_id? → payment_method, created_by → user, created_at |

Indexes: `entry(ledger_page_id, created_at)`, `entry(customer_id)`, `entry(game_id)`, `expense(ledger_page_id)`, `customer(name)`.
Delete rules: entries and expenses cascade with their page; customers, games and methods that are referenced use `restrict`, and the UI offers "disable" (`is_active = false`) instead.
Relations are declared once in `db/relations.ts` with `defineRelations` (Drizzle v1).

## Routes

All under `/dashboard`, protected by `proxy.ts` (cookie check) and `requireSession()` (real check).

| Route | Purpose |
| --- | --- |
| `/dashboard` | Ledger pages list (search, status filter, pagination) and "New page" |
| `/dashboard/pages/[id]` | **Page overview**: metrics, top customers, top games, by payment method, latest entries |
| `/dashboard/pages/[id]/entries` | All entries with totals, search, in/out filter, pagination |
| `/dashboard/pages/[id]/expenses` | All expenses with total, search, pagination |
| `/dashboard/customers` | Customers list and add |
| `/dashboard/games` | Game names list and add (admin: rename, disable, delete) |
| `/dashboard/payment-methods` | Payment methods list and add (admin: rename, disable, delete) |
| `/dashboard/users` | **Admin only**: app users list and create |

### Page detail metrics

Total in, total out, total expenses, profit, **top customers by money in**, **top games** (plays, plus money in split evenly across the games of a payment), money by payment method.

## Workflow (server actions, `app/actions/*.ts`)

Each action: `requireSession()` → role check → zod parse → write → `revalidatePath` → `{ ok, error }`.

1. `createPage(title)` creates an open page.
2. `addEntry({ pageId, customerId, type, amount, paymentMethodId, gameId?, note? })` checks the page is open.
3. `addExpense({ pageId, description, amount, paymentMethodId? })` checks the page is open.
4. `closePage(pageId)` is allowed for any signed-in user and sets `closed_at` and `closed_by`.
5. `reopenPage(pageId)` is admin only.
6. `deleteEntry` / `deleteExpense` are admin only.
7. `createCustomer`, `createGame`, `createPaymentMethod` are open to any user. `update*` / `delete*` / `toggle*` on games and methods are admin only.
8. `createAppUser({ name, email, password, role })` is admin only and uses the Better Auth admin plugin.

## UI approach

- **Lists**: one generic `DataTable` (TanStack Table v9, manual server-side pagination and search, state in the URL: `?q=&page=&pageSize=`). Shareable links, back button works, data is fetched on the server.
- **Mobile**: below `md` the same rows render as stacked **cards** (no horizontal scrolling table). From `md` up, a real table.
- Add forms open in a dialog. They use react-hook-form + zod and call server actions.
- Icons: Solar (`@solar-icons/react`).

## Build steps

1. Install deps (TanStack Table, Solar icons), shadcn components.
2. Schema (`db/schema/records-schema.ts`), relations, migration, push.
3. Authz helpers, money helpers, validation schemas.
4. Data layer (`lib/data/*`): paged and searchable queries, page metrics.
5. Server actions.
6. App shell: sidebar with real nav, user menu.
7. Generic `DataTable` (+ mobile cards) and the pages in the route table above.
8. Seed default payment methods (Cash App, Chime, PayPal).
9. Verify with a production build and a scripted end-to-end run (create page → entries → metrics → close → reopen as admin).

## Status

Steps 1–9 are done. Choices made while building:
- Admins can **delete** entries and expenses but there is no edit. Delete and re-add instead.
- The in-form customer picker is a plain select, with customers added on `/dashboard/customers`.
- "Disable" (`is_active = false`) hides a game or method from the entry form but keeps history.

### Revision: notes removed, multi-game entries, customer photos

- All `note` columns are gone (customer, entry, ledger page). Expenses keep a required `description`.
- `entry.game_id` became the `entry_game` junction table. Existing links were copied over before the column was dropped.
- Customers gained `image_url` and `profile_url`. The add-customer form takes name, optional phone, optional photo and optional Facebook link.
- A ledger page is now three sections (overview, entries, expenses) with a contextual sidebar.
