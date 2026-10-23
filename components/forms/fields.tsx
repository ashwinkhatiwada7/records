"use client";

import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import { CheckCircleIcon } from "@solar-icons/react/linear";

import { CustomerAvatar } from "@/components/customer-avatar";
import { cn } from "@/lib/utils";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Base<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
};

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  ...props
}: Base<T> &
  Omit<React.ComponentProps<"input">, "name" | "value" | "onChange" | "ref">) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            {...props}
            {...field}
            value={field.value ?? ""}
            id={name}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  ...props
}: Base<T> &
  Omit<React.ComponentProps<"textarea">, "name" | "value" | "onChange" | "ref">) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Textarea
            {...props}
            {...field}
            value={field.value ?? ""}
            id={name}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

const NONE = "__none__";

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Select…",
  noneLabel,
}: Base<T> & {
  options: { id: string; name: string }[];
  placeholder?: string;
  /** When set, adds an empty choice that clears the value. */
  noneLabel?: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select
            value={field.value || (noneLabel ? NONE : "")}
            onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
          >
            <SelectTrigger
              id={name}
              className="w-full"
              aria-invalid={fieldState.invalid}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {noneLabel && <SelectItem value={NONE}>{noneLabel}</SelectItem>}
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

/** Customer picker that shows each person's avatar. */
export function CustomerSelectField<T extends FieldValues>({
  control,
  name,
  label,
  customers,
}: Base<T> & {
  customers: { id: string; name: string; imageUrl: string | null }[];
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select value={field.value || ""} onValueChange={field.onChange}>
            <SelectTrigger id={name} className="h-10 w-full" aria-invalid={fieldState.invalid}>
              <SelectValue placeholder={customers.length ? "Choose customer" : "Add a customer first"} />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <CustomerAvatar name={c.name} imageUrl={c.imageUrl} size="sm" />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

/** Multi-select as tappable chips: one payment can cover several games. */
export function GameChipsField<T extends FieldValues>({
  control,
  name,
  label,
  games,
}: Base<T> & { games: { id: string; name: string }[] }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected: string[] = field.value ?? [];
        const toggle = (id: string) =>
          field.onChange(
            selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id],
          );
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>
              {label}
              {selected.length > 0 && (
                <span className="font-normal text-muted-foreground"> · {selected.length} selected</span>
              )}
            </FieldLabel>
            {games.length === 0 ? (
              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                No games yet. Add some on the Games page first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
                {games.map((g) => {
                  const on = selected.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(g.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        on
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      {on && <CheckCircleIcon className="size-4" />}
                      {g.name}
                    </button>
                  );
                })}
              </div>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
