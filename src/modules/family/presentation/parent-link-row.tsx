"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { ArrowRight } from "lucide-react";

type ParentLinkRowProps = {
  readonly id: string;
  readonly parentEmail: string;
  readonly studentEmail: string;
  readonly deleteAction: (id: string) => Promise<void>;
};

export function ParentLinkRow({ id, parentEmail, studentEmail, deleteAction }: ParentLinkRowProps) {
  const t = useTranslations("parentLinks");

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-2 min-w-0 text-sm">
        <span className="font-medium truncate max-w-[160px]" title={parentEmail}>
          {parentEmail}
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground truncate max-w-[160px]" title={studentEmail}>
          {studentEmail}
        </span>
      </div>
      <ConfirmDeleteDialog
        title={t("unlinkConfirmTitle")}
        description={t("unlinkConfirmDesc")}
        onConfirm={() => deleteAction(id)}
        confirmLabel={t("unlinkLabel")}
      >
        <Button type="button" size="sm" variant="outline" className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30">
          {t("unlinkLabel")}
        </Button>
      </ConfirmDeleteDialog>
    </div>
  );
}
