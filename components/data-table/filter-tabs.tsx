"use client";

import { cn } from "@/lib/utils";
import { useUrlParams } from "./use-url-params";

/** Segmented URL filter, e.g. All / Open / Closed. The first option clears the param. */
export function FilterTabs({
  param,
  options,
  prefix = "",
}: {
  param: string;
  options: { value: string; label: string }[];
  prefix?: string;
}) {
  const { get, set } = useUrlParams(prefix);
  const current = get(param);

  return (
    <div className="inline-flex rounded-lg bg-muted p-1" role="tablist">
      {options.map((o, i) => {
        const active = current === o.value || (i === 0 && !current);
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => set({ [param]: i === 0 ? null : o.value })}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
