import type { Metadata } from "next";
import { Suspense } from "react";

import { CustomerDialog } from "@/components/forms/forms";
import { CustomersList } from "@/components/lists/catalog-lists";
import { ListSkeleton, PageHeader } from "@/components/page-header";
import { listParams, type RawSearchParams } from "@/lib/data/params";
import { isAdmin } from "@/lib/authz";
import { requireSession } from "@/lib/session";
import { listCustomers } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Customers · Records" };

async function Content({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const [{ user }, sp] = await Promise.all([requireSession(), searchParams]);
  const { q, page, pageSize } = listParams(sp);
  const { rows, total } = await listCustomers({ q, page, pageSize });
  return (
    <CustomersList
      rows={rows}
      total={total}
      page={page}
      pageSize={pageSize}
      toolbar={<CustomerDialog />}
      isAdmin={isAdmin(user.role)}
    />
  );
}

export default function Page({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  return (
    <>
      <PageHeader
        title="Customers"
        description="People who pay in or get paid out. Pick them when adding an entry."
      />
      <Suspense fallback={<ListSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
