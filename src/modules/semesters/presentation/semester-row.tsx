"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import type { Semester } from "@/modules/semesters/domain/semester";

type SemesterRowProps = {
  readonly semester: Semester;
  readonly deleteAction: (id: string) => Promise<void>;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export function SemesterRow({ semester, deleteAction }: SemesterRowProps) {
  const t = useTranslations("semesters");

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <p className="text-sm">
        {formatDate(semester.startDate)} – {formatDate(semester.endDate)}
      </p>
      <ConfirmDeleteDialog
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        onConfirm={() => deleteAction(semester.id)}
        confirmLabel={t("deleteLabel")}
      >
        <Button type="button" size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30">
          {t("deleteLabel")}
        </Button>
      </ConfirmDeleteDialog>
    </div>
  );
}
