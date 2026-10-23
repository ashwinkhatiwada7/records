"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LinkRoundIcon, TrashBinTrashIcon } from "@solar-icons/react/linear";

import {
  deleteCatalogItem,
  deleteCustomer,
  setCatalogItemActive,
} from "@/app/actions/catalog";
import { columnHelper, DataTable } from "@/components/data-table/data-table";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { CatalogDialog } from "@/components/forms/forms";
import { CustomerAvatar } from "@/components/customer-avatar";
import { LocalDate } from "@/components/local-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type ListProps<R> = {
  rows: R[];
  total: number;
  page: number;
  pageSize: number;
  isAdmin: boolean;
};

// ---- games & payment methods share one row shape ---------------------------

export type CatalogRow = {
  id: string;
  name: string;
  isActive: boolean;
  /** games: times played; payment methods: entries using it */
  count: number;
};

type Kind = "game" | "paymentMethod";

function AdminControls({ kind, row }: { kind: Kind; row: CatalogRow }) {
  const [busy, setBusy] = useState(false);
  async function toggle(next: boolean) {
    setBusy(true);
    const res = await setCatalogItemActive(kind, row.id, next);
    setBusy(false);
    if (!res.ok) toast.error(res.error);
  }
  return (
    <div className="flex items-center gap-1">
      <Switch
        checked={row.isActive}
        disabled={busy}
        onCheckedChange={toggle}
        aria-label={`${row.name} active`}
      />
      <CatalogDialog kind={kind} item={{ id: row.id, name: row.name }} />
      <ConfirmAction
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Delete ${row.name}`}>
            <TrashBinTrashIcon />
          </Button>
        }
        title={`Delete ${row.name}?`}
        description="If it is used by existing entries it cannot be deleted. Turn it off instead."
        confirmLabel="Delete"
        success="Deleted"
        destructive
        action={() => deleteCatalogItem(kind, row.id)}
      />
    </div>
  );
}

const ch = columnHelper<CatalogRow>();
const catalogColumns = (kind: Kind, isAdmin: boolean) => {
  const countHeader = kind === "game" ? "Times played" : "Entries";
  return ch.columns([
    ch.accessor("name", { header: "Name", cell: (c) => <span className="font-medium">{c.getValue()}</span> }),
    ch.accessor("isActive", {
      header: "Status",
      cell: (c) =>
        c.getValue() ? (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Active</Badge>
        ) : (
          <Badge variant="secondary">Off</Badge>
        ),
    }),
    ch.accessor("count", { header: countHeader }),
    ...(isAdmin
      ? [
          ch.display({
            id: "actions",
            header: "Admin",
            cell: (c) => <AdminControls kind={kind} row={c.row.original} />,
          }),
        ]
      : []),
  ]);
};
const sets = {
  game: { admin: catalogColumns("game", true), user: catalogColumns("game", false) },
  paymentMethod: {
    admin: catalogColumns("paymentMethod", true),
    user: catalogColumns("paymentMethod", false),
  },
};

export function CatalogList({
  kind,
  rows,
  total,
  page,
  pageSize,
  isAdmin,
}: ListProps<CatalogRow> & { kind: Kind }) {
  const noun = kind === "game" ? "games" : "payment methods";
  return (
    <DataTable
      columns={isAdmin ? sets[kind].admin : sets[kind].user}
      data={rows}
      total={total}
      page={page}
      pageSize={pageSize}
      searchPlaceholder={`Search ${noun}…`}
      emptyText={`No ${noun} yet.`}
      toolbar={<CatalogDialog kind={kind} />}
      renderCard={(r) => (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {r.count} {kind === "game" ? "plays" : "entries"}
                {!r.isActive && " · off"}
              </p>
            </div>
            {isAdmin && <AdminControls kind={kind} row={r} />}
          </div>
        </div>
      )}
    />
  );
}

// ---- customers -------------------------------------------------------------

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  imageUrl: string | null;
  profileUrl: string | null;
  createdAt: Date;
};

function DeleteCustomer({ row }: { row: CustomerRow }) {
  return (
    <ConfirmAction
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Delete ${row.name}`}>
          <TrashBinTrashIcon />
        </Button>
      }
      title={`Delete ${row.name}?`}
      description="Their profile and photo are removed. This is only possible when they have no entries."
      confirmLabel="Delete"
      success="Customer deleted"
      destructive
      action={() => deleteCustomer(row.id)}
    />
  );
}

function ProfileLink({ url }: { url: string | null }) {
  if (!url) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      <LinkRoundIcon className="size-4" /> Facebook
    </a>
  );
}

const cuh = columnHelper<CustomerRow>();
const customerColumns = (isAdmin: boolean) =>
  cuh.columns([
    cuh.accessor("name", {
      header: "Customer",
      cell: (c) => (
        <span className="flex items-center gap-3">
          <CustomerAvatar name={c.getValue()} imageUrl={c.row.original.imageUrl} size="lg" />
          <span className="font-medium whitespace-nowrap">{c.getValue()}</span>
        </span>
      ),
    }),
    cuh.accessor("phone", {
      header: "Phone",
      cell: (c) => <span className="whitespace-nowrap">{c.getValue() ?? "—"}</span>,
    }),
    cuh.accessor("profileUrl", {
      header: "Facebook",
      cell: (c) => <ProfileLink url={c.getValue()} />,
    }),
    ...(isAdmin
      ? [
          cuh.display({
            id: "actions",
            header: "",
            cell: (c) => (
              <span className="flex justify-end">
                <DeleteCustomer row={c.row.original} />
              </span>
            ),
          }),
        ]
      : []),
  ]);
// Column defs must be referentially stable across renders
const customerColumnSets = { admin: customerColumns(true), user: customerColumns(false) };

export function CustomersList({
  rows,
  total,
  page,
  pageSize,
  toolbar,
  isAdmin,
}: ListProps<CustomerRow> & { toolbar: React.ReactNode }) {
  return (
    <DataTable
      tableOnly
      columns={isAdmin ? customerColumnSets.admin : customerColumnSets.user}
      data={rows}
      total={total}
      page={page}
      pageSize={pageSize}
      searchPlaceholder="Search name or phone…"
      emptyText="No customers yet."
      toolbar={toolbar}
    />
  );
}

// ---- app users -------------------------------------------------------------

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | null;
  createdAt: Date;
};

const uh = columnHelper<UserRow>();
const roleBadge = (role: UserRow["role"]) =>
  role === "admin" ? <Badge>Admin</Badge> : <Badge variant="secondary">User</Badge>;
const userColumns = uh.columns([
  uh.accessor("name", { header: "Name", cell: (c) => <span className="font-medium">{c.getValue()}</span> }),
  uh.accessor("email", { header: "Email" }),
  uh.accessor("role", { header: "Role", cell: (c) => roleBadge(c.getValue()) }),
  uh.accessor("createdAt", { header: "Created", cell: (c) => <LocalDate value={c.getValue()} /> }),
]);

export function UsersList({
  rows,
  total,
  page,
  pageSize,
  toolbar,
}: Omit<ListProps<UserRow>, "isAdmin"> & { toolbar: React.ReactNode }) {
  return (
    <DataTable
      columns={userColumns}
      data={rows}
      total={total}
      page={page}
      pageSize={pageSize}
      searchPlaceholder="Search name or email…"
      toolbar={toolbar}
      renderCard={(r) => (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{r.name}</p>
            <p className="truncate text-xs text-muted-foreground">{r.email}</p>
          </div>
          {roleBadge(r.role)}
        </div>
      )}
    />
  );
}
