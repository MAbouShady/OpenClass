"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Hash, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditStudentModal } from "@/modules/students/presentation/edit-student-modal";
import { EnrollStudentModal } from "@/modules/students/presentation/enroll-student-modal";
import { StudentQrModal } from "@/modules/students/presentation/student-qr-modal";
import type { Level } from "@/modules/levels/domain/level";
import type { CourseOption, ParentOption } from "@/modules/students/domain/student-repository";
import type { StudentWithCourses } from "@/modules/students/domain/student";
import type { ActionState } from "@/shared/domain/action-state";

type StudentTableProps = {
  readonly students: readonly StudentWithCourses[];
  readonly levels: readonly Level[];
  readonly parents: readonly ParentOption[];
  readonly courseOptions: readonly CourseOption[];
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly enrollAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly deleteAction: (id: string) => Promise<ActionState>;
};

/** Students are the highest-volume list in the app, so they get a table. */
export function StudentTable({
  students,
  levels,
  parents,
  courseOptions,
  updateAction,
  enrollAction,
  deleteAction,
}: StudentTableProps) {
  const t = useTranslations("students");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteAction(id);
      if (result.error) setDeleteError(result.error);
    });
  }

  return (
    <>
      {deleteError ? (
        <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {deleteError}
        </p>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">{t("colId")}</TableHead>
            <TableHead>{t("colName")}</TableHead>
            <TableHead>{t("colLevel")}</TableHead>
            <TableHead>{t("colPhone")}</TableHead>
            <TableHead>{t("colCourses")}</TableHead>
            <TableHead className="text-end">{t("colActions")}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {students.map((student) => {
            const uniqueCourses = Array.from(
              new Map(student.enrolledCourses.map((c) => [c.courseId, c.courseTitle])).entries(),
            );

            return (
              <TableRow key={student.id}>
                <TableCell>
                  {student.idNumber !== null ? (
                    <Badge variant="secondary" className="gap-1 font-mono text-xs">
                      <Hash className="h-3 w-3" />
                      {student.idNumber}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="max-w-[14rem]">
                  <div className="truncate font-medium">{student.name}</div>
                  {student.email ? (
                    <div className="truncate text-xs text-muted-foreground">{student.email}</div>
                  ) : null}
                </TableCell>

                <TableCell>
                  {student.levelName ? (
                    <Badge variant="outline" className="text-xs font-normal">
                      {student.levelName}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {student.phone ?? "—"}
                </TableCell>

                <TableCell className="max-w-[16rem]">
                  {uniqueCourses.length === 0 ? (
                    <span className="text-sm text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {uniqueCourses.slice(0, 2).map(([id, title]) => (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="max-w-[9rem] text-xs font-normal"
                        >
                          <span className="truncate">{title}</span>
                        </Badge>
                      ))}
                      {uniqueCourses.length > 2 ? (
                        <Badge variant="outline" className="text-xs font-normal">
                          +{uniqueCourses.length - 2}
                        </Badge>
                      ) : null}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-0.5">
                    <EditStudentModal
                      student={student}
                      levels={levels}
                      parents={parents}
                      updateAction={updateAction}
                    />
                    <EnrollStudentModal
                      studentId={student.id}
                      studentName={student.name}
                      enrolledCourseIds={student.enrolledCourses.map((c) => c.courseId)}
                      courseOptions={courseOptions}
                      enrollAction={enrollAction}
                    />
                    <StudentQrModal studentName={student.name} idNumber={student.idNumber} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirmingId(student.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ConfirmDeleteDialog
        open={confirmingId !== null}
        onOpenChange={(next) => !next && setConfirmingId(null)}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        onConfirm={() => {
          if (confirmingId) handleDelete(confirmingId);
          setConfirmingId(null);
        }}
      />
    </>
  );
}
