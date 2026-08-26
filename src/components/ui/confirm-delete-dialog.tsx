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
  /** Trigger element. Omit when driving the dialog with `open`/`onOpenChange`. */
  readonly children?: React.ReactNode;
  /** Controlled mode, for opening from a dropdown item that unmounts its own trigger. */
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
};

export function ConfirmDeleteDialog({
  title,
  description,
  onConfirm,
  confirmLabel,
  children,
  open: controlledOpen,
  onOpenChange,
}: ConfirmDeleteDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const t = useTranslations("common");

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

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
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
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
