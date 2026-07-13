"use client";

import { useActionState, useState } from "react";
import { BookPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CourseOption } from "@/modules/students/domain/student-repository";
import type { ActionState } from "@/shared/domain/action-state";

type EnrollStudentModalProps = {
  readonly studentId: string;
  readonly studentName: string;
  readonly enrolledCourseIds: readonly string[];
  readonly courseOptions: readonly CourseOption[];
  readonly enrollAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function EnrollStudentModal({
  studentId,
  studentName,
  enrolledCourseIds,
  courseOptions,
  enrollAction,
}: EnrollStudentModalProps) {
  const t = useTranslations("students");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, formAction, pending] = useActionState(enrollAction, {});

  const available = courseOptions.filter(
    (c) => !enrolledCourseIds.includes(c.id) && c.latestSemesterId !== null,
  );

  function toggle(courseId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  function handleOpen(next: boolean) {
    setOpen(next);
    if (!next) setSelected(new Set());
  }

  function handleSubmit(formData: FormData) {
    formData.set("studentId", studentId);
    for (const courseId of selected) {
      const opt = courseOptions.find((c) => c.id === courseId);
      if (opt?.latestSemesterId) formData.append("semesterIds", opt.latestSemesterId);
    }
    return formAction(formData);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={() => handleOpen(true)}
        title={t("enrollBtn")}
      >
        <BookPlus className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("enrollTitle")} — {studentName}</DialogTitle>
          </DialogHeader>

          {state.message ? (
            <div className="flex flex-col gap-3">
              <Alert>
                <AlertDescription>{t("enrolledMsg")}</AlertDescription>
              </Alert>
              <div className="flex justify-end">
                <Button onClick={() => handleOpen(false)}>{tCommon("done")}</Button>
              </div>
            </div>
          ) : available.length === 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{t("noCoursesToEnroll")}</p>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => handleOpen(false)}>{tCommon("close")}</Button>
              </div>
            </div>
          ) : (
            <form action={handleSubmit} className="flex flex-col gap-4 pt-1">
              <div className="flex flex-col gap-2 rounded-md border p-3">
                {available.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={selected.has(c.id)}
                      onCheckedChange={() => toggle(c.id)}
                    />
                    {c.title}
                  </label>
                ))}
              </div>

              {state.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleOpen(false)} disabled={pending}>
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={pending || selected.size === 0}>
                  {pending ? t("enrollSaving") : t("enrollSave")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
