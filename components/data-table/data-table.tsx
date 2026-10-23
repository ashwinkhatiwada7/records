"use client";

import { useRef, useState } from "react";
import {
  createColumnHelper,
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  AltArrowLeftIcon,
  AltArrowRightIcon,
  MagnifierIcon,
} from "@solar-icons/react/linear";

import { cn } from "@/lib/utils";
import { PAGE_SIZES } from "@/lib/data/params";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUrlParams } from "./use-url-params";

// Core-only table: paging, search and filters are handled on the server.
const features = tableFeatures({});

/** Typed column helper for `DataTable` columns: `const h = columnHelper<Row>()`. */
export const columnHelper = <T extends object>() => createColumnHelper<typeof features, T>();

type Props<T extends { id: string }> = {
  columns: ColumnDef<typeof features, T>[];
  /** Always a table (scrolls sideways on phones) instead of cards below `md`. */
  tableOnly?: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  /** Mobile layout: each row becomes a card instead of a table row. */
  renderCard?: (row: T) => React.ReactNode;
  searchPlaceholder?: string;
  /** Extra controls next to the search box (filters, add buttons). */
  toolbar?: React.ReactNode;
  emptyText?: string;
  prefix?: string;
};

/**
 * Server-driven table: the server component fetches one page of rows,
 * this component only renders them and writes search / page changes to the URL.
 * Below `md` rows render as cards, from `md` up as a real table.
 */
export function DataTable<T extends { id: string }>({
  columns,
  tableOnly = false,
  data,
  total,
  page,
  pageSize,
  renderCard,
  searchPlaceholder = "Search…",
  toolbar,
  emptyText = "Nothing here yet.",
  prefix = "",
}: Props<T>) {
  const { get, set, isPending } = useUrlParams(prefix);
  const [search, setSearch] = useState(get("q"));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // keep the box in sync when the URL changes from elsewhere (back button)
  const urlQ = get("q");
  const [seenQ, setSeenQ] = useState(urlQ);
  if (urlQ !== seenQ) {
    setSeenQ(urlQ);
    setSearch(urlQ);
  }

  function onSearch(value: string) {
    setSearch(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => set({ q: value.trim() || null }), 300);
  }

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (row: T) => row.id,
  });

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <MagnifierIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label="Search"
          />
        </div>
        {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
      </div>

      <div className={cn("transition-opacity", isPending && "opacity-60")}>
        {data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <MagnifierIcon className="size-5" />
            </span>
            {urlQ ? `No results for “${urlQ}”.` : emptyText}
          </div>
        ) : (
          <>
            {!tableOnly && renderCard && (
              <div className="grid gap-3 md:hidden">
                {data.map((row) => (
                  <div key={row.id} className="rounded-2xl border bg-card p-4 shadow-xs">
                    {renderCard(row)}
                  </div>
                ))}
              </div>
            )}

            <div
              className={cn(
                "overflow-hidden rounded-2xl border bg-card",
                !tableOnly && "hidden md:block",
              )}
            >
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((group) => (
                    <TableRow key={group.id}>
                      {group.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : (
                            <table.FlexRender header={header} />
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getAllCells().map((cell) => (
                        <TableCell key={cell.id}>
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          {total === 0 ? "0 results" : `Showing ${from}–${to} of ${total}`}
        </p>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => set({ size: v === String(PAGE_SIZES[0]) ? null : v })}
          >
            <SelectTrigger size="sm" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => set({ page: page - 1 > 1 ? String(page - 1) : null })}
            >
              <AltArrowLeftIcon />
            </Button>
            <span className="min-w-16 text-center tabular-nums">
              {page} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              disabled={page >= pageCount}
              onClick={() => set({ page: String(page + 1) })}
            >
              <AltArrowRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
