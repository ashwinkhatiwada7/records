export type RawSearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZES = [10, 20, 50];

/** Reads `q`, `page`, `size` (optionally prefixed) from the URL search params. */
export function listParams(sp: RawSearchParams, prefix = "") {
  const get = (key: string) => {
    const v = sp[prefix + key];
    return Array.isArray(v) ? v[0] : v;
  };
  const size = parseInt(get("size") ?? "", 10);
  return {
    q: (get("q") ?? "").trim().slice(0, 80),
    page: Math.max(1, parseInt(get("page") ?? "1", 10) || 1),
    pageSize: PAGE_SIZES.includes(size) ? size : PAGE_SIZES[0],
    get,
  };
}

/** `%` and `_` typed by the user must not act as wildcards. */
export function likePattern(q: string) {
  return `%${q.replace(/[\\%_]/g, "\\$&")}%`;
}
