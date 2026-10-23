"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * List state (search, page, filters) lives in the URL so links are shareable
 * and the server component re-fetches on change. `prefix` namespaces the keys
 * when a route shows two lists.
 */
export function useUrlParams(prefix = "") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const get = (key: string) => searchParams.get(prefix + key) ?? "";

  const set = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(prefix + key);
        else next.set(prefix + key, value);
      }
      // any change except paging itself goes back to page 1
      if (!("page" in updates)) next.delete(prefix + "page");
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [prefix, pathname, router, searchParams],
  );

  return { get, set, isPending };
}
