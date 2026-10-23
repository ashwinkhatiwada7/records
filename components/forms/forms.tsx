"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddCircleIcon, PenIcon } from "@solar-icons/react/linear";

import {
  addEntry,
  addExpense,
  createPage,
} from "@/app/actions/pages";
import {
  createAppUser,
  createCatalogItem,
  createCustomer,
  renameCatalogItem,
} from "@/app/actions/catalog";
import {
  appUserSchema,
  customerSchema,
  entrySchema,
  expenseSchema,
  nameSchema,
  pageSchema,
  type AppUserValues,
  type CustomerValues,
  type EntryValues,
  type ExpenseValues,
  type NameValues,
  type PageValues,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { CustomerSelectField, GameChipsField, SelectField, TextField } from "./fields";
import { ImagePicker } from "./image-picker";
import { FormDialog, runWithToast } from "./form-dialog";

type Option = { id: string; name: string };
type CustomerOption = Option & { imageUrl: string | null };

function SubmitButton({ submitting, children }: { submitting: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={submitting}>
      {submitting ? "Saving…" : children}
    </Button>
  );
}

const addButton = (label: string) => (
  <Button>
    <AddCircleIcon /> {label}
  </Button>
);

// ---- ledger page ---------------------------------------------------------

export function CreatePageDialog() {
  const router = useRouter();
  return (
    <FormDialog
      title="New page"
      description="All entries and expenses are recorded on a page until it is closed."
      trigger={addButton("New page")}
    >
      {(close) => <CreatePageForm onDone={close} router={router} />}
    </FormDialog>
  );
}

function CreatePageForm({
  onDone,
  router,
}: {
  onDone: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const form = useForm<PageValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    },
  });
  async function onSubmit(values: PageValues) {
    const res = await createPage(values);
    if (!res.ok) return void toast.error(res.error);
    onDone();
    router.push(`/dashboard/pages/${res.data.id}`);
  }
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField control={form.control} name="title" label="Title" />
        <SubmitButton submitting={form.formState.isSubmitting}>Create page</SubmitButton>
      </FieldGroup>
    </form>
  );
}

// ---- entry (payment in / out) -------------------------------------------

export function EntryDialog({
  pageId,
  customers,
  methods,
  games,
}: {
  pageId: string;
  customers: CustomerOption[];
  methods: Option[];
  games: Option[];
}) {
  return (
    <FormDialog
      title="New entry"
      description="Record money received from or paid to a customer."
      trigger={addButton("Add entry")}
    >
      {(close) => (
        <EntryForm
          pageId={pageId}
          customers={customers}
          methods={methods}
          games={games}
          onDone={close}
        />
      )}
    </FormDialog>
  );
}

function EntryForm({
  pageId,
  customers,
  methods,
  games,
  onDone,
}: {
  pageId: string;
  customers: CustomerOption[];
  methods: Option[];
  games: Option[];
  onDone: () => void;
}) {
  const form = useForm<EntryValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      pageId,
      type: "in",
      customerId: "",
      paymentMethodId: "",
      gameIds: [],
      amount: "",
    },
  });
  const type = useWatch({ control: form.control, name: "type" });

  async function onSubmit(values: EntryValues) {
    if (await runWithToast(() => addEntry(values), "Entry added")) onDone();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist">
          {(["in", "out"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={type === t}
              onClick={() => form.setValue("type", t)}
              className={cn(
                "rounded-md py-1.5 text-sm font-medium transition-colors",
                type === t
                  ? t === "in"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-rose-600 text-white shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {t === "in" ? "Payment in" : "Payment out"}
            </button>
          ))}
        </div>
        <CustomerSelectField
          control={form.control}
          name="customerId"
          label="Customer"
          customers={customers}
        />
        <TextField
          control={form.control}
          name="amount"
          label="Amount (USD)"
          inputMode="decimal"
          placeholder="0.00"
          autoComplete="off"
        />
        <SelectField
          control={form.control}
          name="paymentMethodId"
          label="Payment method"
          options={methods}
          placeholder={methods.length ? "Choose method" : "Add a payment method first"}
        />
        {type === "in" && (
          <GameChipsField
            control={form.control}
            name="gameIds"
            label="Games played"
            games={games}
          />
        )}
        <SubmitButton submitting={form.formState.isSubmitting}>Save entry</SubmitButton>
      </FieldGroup>
    </form>
  );
}

// ---- expense --------------------------------------------------------------

export function ExpenseDialog({
  pageId,
  methods,
}: {
  pageId: string;
  methods: Option[];
}) {
  return (
    <FormDialog
      title="New expense"
      description="Money spent while this page is open."
      trigger={
        <Button variant="outline">
          <AddCircleIcon /> Add expense
        </Button>
      }
    >
      {(close) => <ExpenseForm pageId={pageId} methods={methods} onDone={close} />}
    </FormDialog>
  );
}

function ExpenseForm({
  pageId,
  methods,
  onDone,
}: {
  pageId: string;
  methods: Option[];
  onDone: () => void;
}) {
  const form = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { pageId, description: "", amount: "", paymentMethodId: "" },
  });
  async function onSubmit(values: ExpenseValues) {
    if (await runWithToast(() => addExpense(values), "Expense added")) onDone();
  }
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField control={form.control} name="description" label="What was it for?" />
        <TextField
          control={form.control}
          name="amount"
          label="Amount (USD)"
          inputMode="decimal"
          placeholder="0.00"
          autoComplete="off"
        />
        <SelectField
          control={form.control}
          name="paymentMethodId"
          label="Paid with (optional)"
          options={methods}
          noneLabel="Not specified"
          placeholder="Not specified"
        />
        <SubmitButton submitting={form.formState.isSubmitting}>Save expense</SubmitButton>
      </FieldGroup>
    </form>
  );
}

// ---- customer -------------------------------------------------------------

export function CustomerDialog() {
  return (
    <FormDialog title="New customer" trigger={addButton("Add customer")}>
      {(close) => <CustomerForm onDone={close} />}
    </FormDialog>
  );
}

function CustomerForm({ onDone }: { onDone: () => void }) {
  const [image, setImage] = useState<File | null>(null);
  const form = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", profileUrl: "" },
  });
  const name = useWatch({ control: form.control, name: "name" });

  async function onSubmit(values: CustomerValues) {
    const data = new FormData();
    data.set("name", values.name);
    data.set("phone", values.phone ?? "");
    data.set("profileUrl", values.profileUrl ?? "");
    if (image) data.set("image", image);
    if (await runWithToast(() => createCustomer(data), "Customer added")) onDone();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <ImagePicker name={name} onChange={setImage} />
        <TextField control={form.control} name="name" label="Name" autoComplete="off" />
        <TextField
          control={form.control}
          name="phone"
          label="Phone (optional)"
          inputMode="tel"
          autoComplete="off"
        />
        <TextField
          control={form.control}
          name="profileUrl"
          label="Facebook profile link (optional)"
          type="url"
          inputMode="url"
          placeholder="https://facebook.com/username"
          autoComplete="off"
        />
        <SubmitButton submitting={form.formState.isSubmitting}>Save customer</SubmitButton>
      </FieldGroup>
    </form>
  );
}

// ---- games and payment methods ---------------------------------------------

type CatalogKind = "game" | "paymentMethod";
const kindLabel: Record<CatalogKind, string> = {
  game: "game",
  paymentMethod: "payment method",
};

/** Create (no `item`) or rename (admin, with `item`) a game / payment method. */
export function CatalogDialog({
  kind,
  item,
}: {
  kind: CatalogKind;
  item?: { id: string; name: string };
}) {
  const label = kindLabel[kind];
  return (
    <FormDialog
      title={item ? `Rename ${label}` : `New ${label}`}
      trigger={
        item ? (
          <Button variant="ghost" size="icon" aria-label={`Rename ${item.name}`}>
            <PenIcon />
          </Button>
        ) : (
          addButton(`Add ${label}`)
        )
      }
    >
      {(close) => <CatalogForm kind={kind} item={item} onDone={close} />}
    </FormDialog>
  );
}

function CatalogForm({
  kind,
  item,
  onDone,
}: {
  kind: CatalogKind;
  item?: { id: string; name: string };
  onDone: () => void;
}) {
  const form = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: item?.name ?? "" },
  });
  async function onSubmit(values: NameValues) {
    const ok = await runWithToast(
      () =>
        item
          ? renameCatalogItem(kind, item.id, values)
          : createCatalogItem(kind, values),
      item ? "Renamed" : "Added",
    );
    if (ok) onDone();
  }
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField control={form.control} name="name" label="Name" autoComplete="off" />
        <SubmitButton submitting={form.formState.isSubmitting}>Save</SubmitButton>
      </FieldGroup>
    </form>
  );
}

// ---- app users (admin) ------------------------------------------------------

export function AppUserDialog() {
  return (
    <FormDialog
      title="New user"
      description="Public sign-up is off. Share the credentials with the person."
      trigger={addButton("Add user")}
    >
      {(close) => <AppUserForm onDone={close} />}
    </FormDialog>
  );
}

function AppUserForm({ onDone }: { onDone: () => void }) {
  const form = useForm<AppUserValues>({
    resolver: zodResolver(appUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "user" },
  });
  async function onSubmit(values: AppUserValues) {
    if (await runWithToast(() => createAppUser(values), "User created")) onDone();
  }
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField control={form.control} name="name" label="Name" />
        <TextField control={form.control} name="email" label="Email" type="email" autoComplete="off" />
        <TextField
          control={form.control}
          name="password"
          label="Temporary password"
          type="text"
          autoComplete="off"
        />
        <SelectField
          control={form.control}
          name="role"
          label="Role"
          options={[
            { id: "user", name: "User" },
            { id: "admin", name: "Admin" },
          ]}
        />
        <SubmitButton submitting={form.formState.isSubmitting}>Create user</SubmitButton>
      </FieldGroup>
    </form>
  );
}
