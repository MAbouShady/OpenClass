"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { CourseForm } from "@/modules/courses/presentation/course-form";
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
  const levelName = levels.find((level) => level.id === course.levelId)?.name ?? "Unknown level";

  if (editing) {
    return (
      <div className="border-b py-4">
        <CourseForm
          action={updateAction}
          levels={levels}
          defaultValues={course}
          submitLabel="Save changes"
        />
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="mt-2">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b py-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{course.title}</span>
          <Badge variant="secondary">{levelName}</Badge>
          <Badge variant={course.sessionType === "ONLINE" ? "default" : "outline"}>
            {course.sessionType === "ONLINE" ? "Online" : "Offline"}
          </Badge>
        </div>
        {course.description ? (
          <p className="text-sm text-muted-foreground">{course.description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/teacher/courses/${course.id}/sessions`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Sessions
        </Link>
        <Link
          href={`/dashboard/teacher/courses/${course.id}/semesters`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Semesters
        </Link>
        <Link
          href={`/dashboard/teacher/courses/${course.id}/payments`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Payments
        </Link>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <form action={deleteAction.bind(null, course.id)}>
          <Button type="submit" variant="outline" size="sm" className="text-destructive hover:text-destructive">
            Delete
          </Button>
        </form>
      </div>
    </div>
  );
}
