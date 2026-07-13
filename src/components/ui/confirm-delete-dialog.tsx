"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmDeleteDialogProps = {
  readonly title: string;
  readonly description: string;
  readonly onConfirm: () => void | Promise<void>;
  readonly confirmLabel?: string;
  readonly children: React.ReactNode;
};

export function ConfirmDeleteDialog({
  title,
  description,
  onConfirm,
  confirmLabel,
  children,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const t = useTranslations("common");

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button variant="destructive" disabled={pending} onClick={handleConfirm}>
            {pending ? "…" : (confirmLabel ?? t("delete"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
