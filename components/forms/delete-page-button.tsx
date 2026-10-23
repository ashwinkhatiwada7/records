"use client";

import { useRouter } from "next/navigation";
import { TrashBinTrashIcon } from "@solar-icons/react/linear";

import { deletePage } from "@/app/actions/pages";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "./confirm-action";

/** Admin only (the server action enforces it). `redirectTo` is for use on the page's own route. */
export function DeletePageButton({
  pageId,
  title,
  redirectTo,
  iconOnly = false,
}: {
  pageId: string;
  title: string;
  redirectTo?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  return (
    <ConfirmAction
      trigger={
        iconOnly ? (
          <Button variant="ghost" size="icon" aria-label={`Delete ${title}`}>
            <TrashBinTrashIcon />
          </Button>
        ) : (
          <Button variant="destructive">
            <TrashBinTrashIcon /> Delete page
          </Button>
        )
      }
      title={`Delete “${title}”?`}
      description="This permanently deletes the page together with all of its entries and expenses. It cannot be undone."
      confirmLabel="Delete page"
      success="Page deleted"
      destructive
      action={() => deletePage(pageId)}
      onSuccess={() => redirectTo && router.replace(redirectTo)}
    />
  );
}
