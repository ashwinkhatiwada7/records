"use client";

import Link from "next/link";
import { AltArrowRightIcon } from "@solar-icons/react/linear";

import { columnHelper, DataTable } from "@/components/data-table/data-table";
import { FilterTabs } from "@/components/data-table/filter-tabs";
import { DeletePageButton } from "@/components/forms/delete-page-button";
import { LocalDate } from "@/components/local-date";
import { Money, Stat, StatusBadge } from "./shared";

export type PageRow = {
  id: string;
  title: string;
  status: "open" | "closed";
  openedAt: Date;
  closedAt: Date | null;
  totalIn: number;
  totalOut: number;
  totalExpense: number;
};

const profit = (r: PageRow) => r.totalIn - r.totalOut - r.totalExpense;
const h = columnHelper<PageRow>();
const pageColumns = (isAdmin: boolean) => h.columns([
  h.accessor("title", {
    header: "Page",
    cell: (c) => (
      <Link href={`/dashboard/pages/${c.row.original.id}`} className="font-medium hover:underline">
        {c.getValue()}
      </Link>
    ),
  }),
  h.accessor("status", { header: "Status", cell: (c) => <StatusBadge status={c.getValue()} /> }),
  h.accessor("openedAt", { header: "Opened", cell: (c) => <LocalDate value={c.getValue()} /> }),
  h.accessor("totalIn", { header: "In", cell: (c) => <Money cents={c.getValue()} tone="in" /> }),
  h.accessor("totalOut", { header: "Out", cell: (c) => <Money cents={c.getValue()} tone="out" /> }),
  h.accessor("totalExpense", { header: "Expenses", cell: (c) => <Money cents={c.getValue()} /> }),
  h.display({
    id: "profit",
    header: "Profit",
    cell: (c) => <Money cents={profit(c.row.original)} tone="profit" className="font-medium" />,
  }),
  h.display({
    id: "go",
    header: "",
    cell: (c) => (
      <span className="flex items-center justify-end gap-1">
        {isAdmin && (
          <DeletePageButton
            pageId={c.row.original.id}
            title={c.row.original.title}
            iconOnly
          />
        )}
        <Link
          href={`/dashboard/pages/${c.row.original.id}`}
          aria-label="Open page"
          className="p-2 text-muted-foreground"
        >
          <AltArrowRightIcon className="size-4" />
        </Link>
      </span>
    ),
  }),
]);
// Column defs must be referentially stable across renders
const columnSets = { admin: pageColumns(true), user: pageColumns(false) };



export function PagesList(props: {
  rows: PageRow[];
  total: number;
  page: number;
  pageSize: number;
  isAdmin: boolean;
}) {
  return (
    <DataTable
      columns={props.isAdmin ? columnSets.admin : columnSets.user}
      data={props.rows}
      total={props.total}
      page={props.page}
      pageSize={props.pageSize}
      searchPlaceholder="Search pages…"
      emptyText="No pages yet. Create the first one."
      toolbar={
        <FilterTabs
          param="status"
          options={[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
          ]}
        />
      }
      renderCard={(r) => (
        <div className="space-y-3">
        <Link href={`/dashboard/pages/${r.id}`} className="block space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                <LocalDate value={r.openedAt} />
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <Stat label="In"><Money cents={r.totalIn} tone="in" /></Stat>
            <Stat label="Out"><Money cents={r.totalOut} tone="out" /></Stat>
            <Stat label="Expenses"><Money cents={r.totalExpense} /></Stat>
            <Stat label="Profit"><Money cents={profit(r)} tone="profit" /></Stat>
          </dl>
        </Link>
        {props.isAdmin && (
          <div className="flex justify-end border-t pt-2">
            <DeletePageButton pageId={r.id} title={r.title} iconOnly />
          </div>
        )}
        </div>
      )}
    />
  );
}
