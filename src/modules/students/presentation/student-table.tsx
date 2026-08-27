"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Hash, Phone, Trash2 } from "lucide-react";
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

type RowActions = {
  readonly levels: readonly Level[];
  readonly parents: readonly ParentOption[];
  readonly courseOptions: readonly CourseOption[];
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly enrollAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

type StudentTableProps = RowActions & {
  readonly students: readonly StudentWithCourses[];
  readonly deleteAction: (id: string) => Promise<ActionState>;
};

/** Courses a student is on, deduplicated across semesters. */
function uniqueCoursesOf(student: StudentWithCourses) {
  return Array.from(
    new Map(student.enrolledCourses.map((c) => [c.courseId, c.courseTitle])).entries(),
  );
}

type StudentActionsProps = RowActions & {
  readonly student: StudentWithCourses;
  /** Mobile triggers are taller and labelled; table triggers stay icon-only. */
  readonly mobile: boolean;
  readonly onDelete: (id: string) => void;
};

/** Edit / enrol / QR / delete — the same four actions in both layouts. */
function StudentActions({ student, mobile, onDelete, ...row }: StudentActionsProps) {
  const tCommon = useTranslations("common");
  const triggerClassName = mobile ? "h-9 flex-1 gap-1.5 px-2 text-xs" : undefined;

  return (
    <>
      <EditStudentModal
        student={student}
        levels={row.levels}
        parents={row.parents}
        updateAction={row.updateAction}
        triggerClassName={triggerClassName}
        showLabel={mobile}
      />
      <EnrollStudentModal
        studentId={student.id}
        studentName={student.name}
        enrolledCourseIds={student.enrolledCourses.map((c) => c.courseId)}
        courseOptions={row.courseOptions}
        enrollAction={row.enrollAction}
        triggerClassName={triggerClassName}
        showLabel={mobile}
      />
      <StudentQrModal
        studentName={student.name}
        idNumber={student.idNumber}
        triggerClassName={triggerClassName}
        showLabel={mobile}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={
          mobile
            ? "h-9 flex-1 gap-1.5 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            : "h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        }
        onClick={() => onDelete(student.id)}
        title={tCommon("delete")}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {mobile ? <span>{tCommon("delete")}</span> : null}
      </Button>
    </>
  );
}

type StudentEntryProps = RowActions & {
  readonly student: StudentWithCourses;
  readonly onDelete: (id: string) => void;
};

/** Phone layout: everything stacked, with the actions always on screen. */
function StudentCard({ student, onDelete, ...row }: StudentEntryProps) {
  const t = useTranslations("students");
  const uniqueCourses = uniqueCoursesOf(student);

  return (
    <li className="flex flex-col gap-2.5 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{student.name}</p>
          {student.email ? (
            <p className="truncate text-xs text-muted-foreground">{student.email}</p>
          ) : null}
        </div>
        {student.idNumber !== null ? (
          <Badge variant="secondary" className="shrink-0 gap-1 font-mono text-xs">
            <Hash className="h-3 w-3" />
            {student.idNumber}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {student.levelName ? (
          <Badge variant="outline" className="text-xs font-normal">
            {student.levelName}
          </Badge>
        ) : null}
        {student.phone ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <span dir="ltr">{student.phone}</span>
          </span>
        ) : null}
      </div>

      {uniqueCourses.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {uniqueCourses.map(([id, title]) => (
            <Badge key={id} variant="secondary" className="max-w-[12rem] text-xs font-normal">
              <span className="truncate">{title}</span>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("notEnrolled")}</p>
      )}

      <div className="flex items-center gap-1 border-t pt-2">
        <StudentActions student={student} mobile onDelete={onDelete} {...row} />
      </div>
    </li>
  );
}

/** Tablet and up: the dense row. */
function StudentRow({ student, onDelete, ...row }: StudentEntryProps) {
  const uniqueCourses = uniqueCoursesOf(student);

  return (
    <TableRow>
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
              <Badge key={id} variant="secondary" className="max-w-[9rem] text-xs font-normal">
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
          <StudentActions student={student} mobile={false} onDelete={onDelete} {...row} />
        </div>
      </TableCell>
    </TableRow>
  );
}

/**
 * Students are the highest-volume list in the app, so they get a table — but a
 * six-column table pushes its actions column off a phone screen, so below `md`
 * the same rows render as cards instead.
 */
export function StudentTable({ students, deleteAction, ...row }: StudentTableProps) {
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

      <ul className="divide-y md:hidden">
        {students.map((student) => (
          <StudentCard key={student.id} student={student} onDelete={setConfirmingId} {...row} />
        ))}
      </ul>

      <div className="hidden md:block">
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
            {students.map((student) => (
              <StudentRow key={student.id} student={student} onDelete={setConfirmingId} {...row} />
            ))}
          </TableBody>
        </Table>
      </div>

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
