"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Result = { ok: true } | { ok: false; error: string };

/** Button + confirmation dialog around a server action (delete, close, reopen…). */
export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  success,
  destructive,
  action,
  onSuccess,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  success: string;
  destructive?: boolean;
  action: () => Promise<Result>;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const res = await action();
    setBusy(false);
    if (!res.ok) return void toast.error(res.error);
    toast.success(success);
    setOpen(false);
    onSuccess?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={confirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
