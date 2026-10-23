import type { Metadata } from "next";
import { Suspense } from "react";

import { CreatePageDialog } from "@/components/forms/forms";
import { PagesList } from "@/components/lists/pages-list";
import { ListSkeleton, PageHeader } from "@/components/page-header";
import { isAdmin } from "@/lib/authz";
import { requireSession } from "@/lib/session";
import { listPages } from "@/lib/data/queries";
import { listParams, type RawSearchParams } from "@/lib/data/params";

export const metadata: Metadata = { title: "Pages · Records" };

async function Content({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const [{ user }, sp] = await Promise.all([requireSession(), searchParams]);
  const { q, page, pageSize, get } = listParams(sp);
  const { rows, total } = await listPages({ q, page, pageSize, status: get("status") });
  return (
    <PagesList
      rows={rows}
      total={total}
      page={page}
      pageSize={pageSize}
      isAdmin={isAdmin(user.role)}
    />
  );
}

export default function Page({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  return (
    <>
      <PageHeader
        title="Pages"
        description="Each page collects the payments in, payments out and expenses until it is closed."
        actions={<CreatePageDialog />}
      />
      <Suspense fallback={<ListSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
