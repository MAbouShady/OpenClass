"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { CourseForm } from "@/modules/courses/presentation/course-form";
import { PAYMENT_FREQUENCY_LABELS } from "@/modules/courses/domain/payment-frequency";
import type { Course } from "@/modules/courses/domain/course";
import type { Level } from "@/modules/levels/domain/level";
import type { ActionState } from "@/shared/domain/action-state";

type CourseRowProps = {
  readonly course: Course;
  readonly levels: readonly Level[];
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly deleteAction: (id: string) => Promise<void>;
};

export function CourseRow({ course, levels, updateAction, deleteAction }: CourseRowProps) {
  const [editing, setEditing] = useState(false);
  const t = useTranslations("courses");
  const levelName = levels.find((level) => level.id === course.levelId)?.name ?? "Unknown level";

  if (editing) {
    return (
      <div className="border-b py-4">
        <CourseForm
          action={updateAction}
          levels={levels}
          defaultValues={course}
          submitLabel={t("saveLabel")}
          onSuccess={() => setEditing(false)}
        />
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="mt-2">
          {t("cancelLabel")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b py-4">
      <div className="space-y-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium truncate">{course.title}</span>
          <Badge variant="secondary">{levelName}</Badge>
          <Badge variant={course.sessionType === "ONLINE" ? "default" : "outline"}>
            {course.sessionType === "ONLINE" ? "Online" : "Offline"}
          </Badge>
          <Badge variant="outline" className="text-xs font-normal">
            {PAYMENT_FREQUENCY_LABELS[course.paymentFrequency]}
          </Badge>
        </div>
        {course.description ? (
          <p className="text-sm text-muted-foreground truncate">{course.description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href={`/dashboard/teacher/courses/${course.id}/sessions`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("sessionsLabel")}
        </Link>
        <Link
          href={`/dashboard/teacher/courses/${course.id}/semesters`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("semestersLabel")}
        </Link>
        <Link
          href={`/dashboard/teacher/courses/${course.id}/payments`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("paymentsLabel")}
        </Link>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          {t("editLabel")}
        </Button>
        <ConfirmDeleteDialog
          title={t("deleteConfirmTitle")}
          description={t("deleteConfirmDesc")}
          onConfirm={() => deleteAction(course.id)}
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
