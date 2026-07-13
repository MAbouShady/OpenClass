"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Check, X, Phone, Hash, BookOpen, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditStudentModal } from "@/modules/students/presentation/edit-student-modal";
import { EnrollStudentModal } from "@/modules/students/presentation/enroll-student-modal";
import { StudentQrModal } from "@/modules/students/presentation/student-qr-modal";
import type { Level } from "@/modules/levels/domain/level";
import type { CourseOption, ParentOption } from "@/modules/students/domain/student-repository";
import type { StudentWithCourses } from "@/modules/students/domain/student";
import type { ActionState } from "@/shared/domain/action-state";

type StudentCardProps = {
  readonly student: StudentWithCourses;
  readonly levels: readonly Level[];
  readonly parents: readonly ParentOption[];
  readonly courseOptions: readonly CourseOption[];
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly enrollAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly deleteAction: (id: string) => Promise<ActionState>;
};

export function StudentCard({ student, levels, parents, courseOptions, updateAction, enrollAction, deleteAction }: StudentCardProps) {
  const t = useTranslations("students");
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteAction(student.id);
      if (result.error) {
        setDeleteError(result.error);
        setConfirming(false);
      }
    });
  }

  const uniqueCourses = Array.from(
    new Map(student.enrolledCourses.map((c) => [c.courseId, c.courseTitle])).entries(),
  );

  return (
    <div className="border-b py-4 last:border-0">
      {deleteError && (
        <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{deleteError}</p>
      )}
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {student.idNumber !== null ? (
            <Badge variant="secondary" className="font-mono text-xs gap-1">
              <Hash className="h-3 w-3" />
              {student.idNumber}
            </Badge>
          ) : null}
          <span className="font-medium">{student.name}</span>
          {student.levelName ? (
            <Badge variant="outline" className="text-xs">{student.levelName}</Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {student.email ? <span>{student.email}</span> : null}
          {student.phone ? (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {student.phone}
            </span>
          ) : null}
          {student.parentName ? (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {student.parentName}
            </span>
          ) : null}
        </div>

        {uniqueCourses.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {uniqueCourses.map(([id, title]) => (
              <Badge key={id} variant="secondary" className="text-xs font-normal">
                {title}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("notEnrolled")}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <EnrollStudentModal
          studentId={student.id}
          studentName={student.name}
          enrolledCourseIds={student.enrolledCourses.map((c) => c.courseId)}
          courseOptions={courseOptions}
          enrollAction={enrollAction}
        />
        <StudentQrModal
          studentName={student.name}
          idNumber={student.idNumber}
        />
        <EditStudentModal
          student={student}
          levels={levels}
          parents={parents}
          updateAction={updateAction}
        />

        {confirming ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-7 px-2"
              disabled={isPending}
              onClick={handleDelete}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => setConfirming(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
    </div>
  );
}
