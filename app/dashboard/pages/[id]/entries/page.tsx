import type { Metadata } from "next";
import { Suspense } from "react";

import { EntriesList } from "@/components/lists/entries-list";
import { ListSkeleton } from "@/components/page-header";
import { isAdmin } from "@/lib/authz";
import { listParams, type RawSearchParams } from "@/lib/data/params";
import { listEntries } from "@/lib/data/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Entries · Records" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
};

async function Content({ params, searchParams }: Props) {
  const [{ id }, sp, { user }] = await Promise.all([params, searchParams, requireSession()]);
  const p = listParams(sp, "e_");
  const entries = await listEntries(id, {
    q: p.q,
    page: p.page,
    pageSize: p.pageSize,
    type: p.get("type"),
  });

  return (
    <EntriesList
      rows={entries.rows}
      total={entries.total}
      page={p.page}
      pageSize={p.pageSize}
      isAdmin={isAdmin(user.role)}
    />
  );
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Content {...props} />
    </Suspense>
  );
}
