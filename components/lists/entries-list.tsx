"use client";

import { TrashBinTrashIcon } from "@solar-icons/react/linear";

import { deleteEntry, deleteExpense } from "@/app/actions/pages";
import { columnHelper, DataTable } from "@/components/data-table/data-table";
import { FilterTabs } from "@/components/data-table/filter-tabs";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { CustomerAvatar } from "@/components/customer-avatar";
import { LocalDate } from "@/components/local-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Money } from "./shared";

export type EntryRow = {
  id: string;
  type: "in" | "out";
  amountCents: number;
  createdAt: Date;
  addedBy: string;
  customerName: string;
  customerImageUrl: string | null;
  methodName: string;
  gameNames: string[];
};

export type ExpenseRow = {
  id: string;
  description: string;
  amountCents: number;
  createdAt: Date;
  addedBy: string;
  methodName: string | null;
};

export function CustomerCell({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  return (
    <span className="flex items-center gap-2.5">
      <CustomerAvatar name={name} imageUrl={imageUrl} />
      <span className="font-medium">{name}</span>
    </span>
  );
}

export function GameBadges({ names }: { names: string[] }) {
  if (!names.length) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {names.map((n) => (
        <Badge key={n} variant="outline" className="font-normal">
          {n}
        </Badge>
      ))}
    </span>
  );
}

function DeleteButton({ label, action }: { label: string; action: () => Promise<{ ok: true } | { ok: false; error: string }> }) {
  return (
    <ConfirmAction
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Delete ${label}`}>
          <TrashBinTrashIcon />
        </Button>
      }
      title={`Delete ${label}?`}
      description="This changes the page totals and cannot be undone."
      confirmLabel="Delete"
      success="Deleted"
      destructive
      action={action}
    />
  );
}

type ListProps<R> = { rows: R[]; total: number; page: number; pageSize: number; isAdmin: boolean };

const eh = columnHelper<EntryRow>();
const entryColumns = (isAdmin: boolean) => {
  const h = eh;
  return h.columns([
    h.accessor("createdAt", {
      header: "Date",
      cell: (c) => (
        <span className="whitespace-nowrap text-muted-foreground">
          <LocalDate value={c.getValue()} withTime />
        </span>
      ),
    }),
    h.accessor("customerName", {
      header: "Name",
      cell: (c) => (
        <span className="whitespace-nowrap">
          <CustomerCell name={c.getValue()} imageUrl={c.row.original.customerImageUrl} />
        </span>
      ),
    }),
    h.accessor("amountCents", {
      header: "Amount",
      cell: (c) => {
        const { type, methodName } = c.row.original;
        return (
          <span className="flex flex-col whitespace-nowrap">
            <span className="font-semibold">
              <Money cents={c.getValue()} tone={type} />
              <span className="sr-only">{type === "in" ? " received" : " paid out"}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {type === "in" ? "In" : "Out"} · {methodName}
            </span>
          </span>
        );
      },
    }),
    h.accessor("gameNames", { header: "Games", cell: (c) => <GameBadges names={c.getValue()} /> }),
    h.accessor("addedBy", {
      header: "Added by",
      cell: (c) => <span className="whitespace-nowrap text-muted-foreground">{c.getValue()}</span>,
    }),
    ...(isAdmin
      ? [
          h.display({
            id: "actions",
            header: "",
            cell: (c) => (
              <span className="flex justify-end">
                <DeleteButton label="entry" action={() => deleteEntry(c.row.original.id)} />
              </span>
            ),
          }),
        ]
      : []),
  ]);
};
// Column defs must be referentially stable across renders
const entryColumnSets = { admin: entryColumns(true), user: entryColumns(false) };

export function EntriesList({ rows, total, page, pageSize, isAdmin }: ListProps<EntryRow>) {
  const columns = isAdmin ? entryColumnSets.admin : entryColumnSets.user;

  return (
    <DataTable
      tableOnly
      columns={columns}
      data={rows}
      total={total}
      page={page}
      pageSize={pageSize}
      prefix="e_"
      searchPlaceholder="Search customer or game…"
      emptyText="No entries on this page yet."
      toolbar={
        <FilterTabs
          prefix="e_"
          param="type"
          options={[
            { value: "all", label: "All" },
            { value: "in", label: "In" },
            { value: "out", label: "Out" },
          ]}
        />
      }
    />
  );
}

const xh = columnHelper<ExpenseRow>();
const expenseColumns = (isAdmin: boolean) => {
  const h = xh;
  return h.columns([
    h.accessor("createdAt", {
      header: "Date",
      cell: (c) => (
        <span className="whitespace-nowrap text-muted-foreground">
          <LocalDate value={c.getValue()} withTime />
        </span>
      ),
    }),
    h.accessor("description", {
      header: "Name",
      cell: (c) => <span className="font-medium">{c.getValue()}</span>,
    }),
    h.accessor("amountCents", {
      header: "Amount",
      cell: (c) => (
        <span className="flex flex-col whitespace-nowrap">
          <Money cents={c.getValue()} className="font-semibold" />
          {c.row.original.methodName && (
            <span className="text-xs text-muted-foreground">{c.row.original.methodName}</span>
          )}
        </span>
      ),
    }),
    h.accessor("addedBy", {
      header: "Added by",
      cell: (c) => <span className="whitespace-nowrap text-muted-foreground">{c.getValue()}</span>,
    }),
    ...(isAdmin
      ? [
          h.display({
            id: "actions",
            header: "",
            cell: (c) => (
              <span className="flex justify-end">
                <DeleteButton label="expense" action={() => deleteExpense(c.row.original.id)} />
              </span>
            ),
          }),
        ]
      : []),
  ]);
};
const expenseColumnSets = { admin: expenseColumns(true), user: expenseColumns(false) };

export function ExpensesList({ rows, total, page, pageSize, isAdmin }: ListProps<ExpenseRow>) {
  const columns = isAdmin ? expenseColumnSets.admin : expenseColumnSets.user;

  return (
    <DataTable
      tableOnly
      columns={columns}
      data={rows}
      total={total}
      page={page}
      pageSize={pageSize}
      prefix="x_"
      searchPlaceholder="Search expenses…"
      emptyText="No expenses on this page yet."
    />
  );
}
