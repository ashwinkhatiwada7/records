import Link from "next/link";
import { Suspense } from "react";
import { DangerCircleIcon, LockKeyholeIcon, LockUnlockedIcon } from "@solar-icons/react/linear";

import { closePage, reopenPage } from "@/app/actions/pages";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { DeletePageButton } from "@/components/forms/delete-page-button";
import { EntryDialog, ExpenseDialog } from "@/components/forms/forms";
import { StatusBadge } from "@/components/lists/shared";
import { ListSkeleton, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/authz";
import { getEntryFormOptions, getPage } from "@/lib/data/queries";
import { requireSession } from "@/lib/session";

function PageMissing() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <DangerCircleIcon className="size-6 text-muted-foreground" />
      </span>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        This page doesn&apos;t exist anymore. It may have been deleted by an admin.
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to all pages</Link>
      </Button>
    </div>
  );
}

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

async function Shell({ children, params }: Props) {
  const { id } = await params;
  const [{ user }, page] = await Promise.all([requireSession(), getPage(id)]);
  // Rendered inline rather than via notFound(): a thrown 404 trips the dev
  // instant-navigation validator, and this is a normal case (page deleted by an admin).
  if (!page) return <PageMissing />;

  const isOpen = page.status === "open";
  const admin = isAdmin(user.role);
  const options = isOpen ? await getEntryFormOptions() : null;

  return (
    <>
      <PageHeader
        back={{ href: "/dashboard", label: "All pages" }}
        title={page.title}
        badge={<StatusBadge status={page.status} />}
        description={
          isOpen
            ? `Opened ${page.openedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            : `Closed ${page.closedAt?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) ?? ""}${page.closedByName ? ` by ${page.closedByName}` : ""}. Entries are locked.`
        }
        actions={
          <>
          {isOpen ? (
            <>
              {options && (
                <EntryDialog
                  pageId={id}
                  customers={options.customers}
                  methods={options.methods}
                  games={options.games}
                />
              )}
              {options && <ExpenseDialog pageId={id} methods={options.methods} />}
              <ConfirmAction
                trigger={
                  <Button variant="outline">
                    <LockKeyholeIcon /> Close page
                  </Button>
                }
                title="Close this page?"
                description="No more entries or expenses can be added. Only an admin can reopen it."
                confirmLabel="Close page"
                success="Page closed"
                action={closePage.bind(null, id)}
              />
            </>
          ) : admin ? (
            <ConfirmAction
              trigger={
                <Button variant="outline">
                  <LockUnlockedIcon /> Reopen
                </Button>
              }
              title="Reopen this page?"
              description="Entries and expenses can be added again."
              confirmLabel="Reopen"
              success="Page reopened"
              action={reopenPage.bind(null, id)}
            />
          ) : null}
          {admin && (
            <DeletePageButton pageId={id} title={page.title} redirectTo="/dashboard" />
          )}
          </>
        }
      />
      {children}
    </>
  );
}

export default function PageLayout(props: Props) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Shell {...props} />
    </Suspense>
  );
}
