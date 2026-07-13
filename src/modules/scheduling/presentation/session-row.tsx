"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import type { ClassSession } from "@/modules/scheduling/domain/class-session";

type SessionRowProps = {
  readonly session: ClassSession;
  readonly deleteAction: (id: string) => Promise<void>;
};

function formatRange(start: Date, end: Date): string {
  const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
  const timeFormatter = new Intl.DateTimeFormat("en", { timeStyle: "short" });
  return `${dateFormatter.format(start)} – ${timeFormatter.format(end)}`;
}

export function SessionRow({ session, deleteAction }: SessionRowProps) {
  const t = useTranslations("sessions");

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <p className="text-sm">{formatRange(session.startTime, session.endTime)}</p>
      <div className="flex gap-2">
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          href={`/dashboard/teacher/courses/${session.courseId}/sessions/${session.id}/attendance`}
        >
          {t("attendanceLabel")}
        </Link>
        <ConfirmDeleteDialog
          title={t("deleteConfirmTitle")}
          description={t("deleteConfirmDesc")}
          onConfirm={() => deleteAction(session.id)}
          confirmLabel={t("deleteLabel")}
        >
          <Button type="button" size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30">
            {t("deleteLabel")}
          </Button>
        </ConfirmDeleteDialog>
      </div>
    </div>
  );
}
