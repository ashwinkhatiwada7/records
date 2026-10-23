import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogList } from "@/components/lists/catalog-lists";
import { ListSkeleton, PageHeader } from "@/components/page-header";
import { isAdmin } from "@/lib/authz";
import { listParams, type RawSearchParams } from "@/lib/data/params";
import { listPaymentMethods } from "@/lib/data/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Payment methods · Records" };

async function Content({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const [{ user }, sp] = await Promise.all([requireSession(), searchParams]);
  const { q, page, pageSize } = listParams(sp);
  const { rows, total } = await listPaymentMethods({ q, page, pageSize });
  return (
    <CatalogList
      kind="paymentMethod"
      rows={rows.map((r) => ({ id: r.id, name: r.name, isActive: r.isActive, count: r.uses }))}
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
        title="Payment methods"
        description="Cash App, Chime, PayPal and anything else you accept."
      />
      <Suspense fallback={<ListSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
