"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

type SecretaryRowProps = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly deleteAction: (id: string) => Promise<void>;
};

export function SecretaryRow({ id, name, email, deleteAction }: SecretaryRowProps) {
  const t = useTranslations("secretaries");

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{email}</p>
      </div>
      <ConfirmDeleteDialog
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        onConfirm={() => deleteAction(id)}
        confirmLabel={t("deleteLabel")}
      >
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
        >
          {t("deleteLabel")}
        </Button>
      </ConfirmDeleteDialog>
    </div>
  );
}
