import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppUserDialog } from "@/components/forms/forms";
import { UsersList } from "@/components/lists/catalog-lists";
import { ListSkeleton, PageHeader } from "@/components/page-header";
import { isAdmin } from "@/lib/authz";
import { listParams, type RawSearchParams } from "@/lib/data/params";
import { listAppUsers } from "@/lib/data/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Users · Records" };

async function Content({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const [{ user }, sp] = await Promise.all([requireSession(), searchParams]);
  if (!isAdmin(user.role)) redirect("/dashboard");

  const { q, page, pageSize } = listParams(sp);
  const { rows, total } = await listAppUsers({ q, page, pageSize });
  return (
    <UsersList
      rows={rows}
      total={total}
      page={page}
      pageSize={pageSize}
      toolbar={<AppUserDialog />}
    />
  );
}

export default function Page({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  return (
    <>
      <PageHeader
        title="Users"
        description="People who can sign in. Only admins can create accounts."
      />
      <Suspense fallback={<ListSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
