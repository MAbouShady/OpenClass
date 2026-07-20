"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseRow } from "@/modules/courses/presentation/course-row";
import type { Course } from "@/modules/courses/domain/course";
import type { Level } from "@/modules/levels/domain/level";
import type { ActionState } from "@/shared/domain/action-state";

type Props = {
  courses: readonly Course[];
  levels: readonly Level[];
  teacherId: string;
  updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (id: string) => Promise<void>;
  noCoursesLabel: string;
};

export function CourseListWithFilter({ courses, levels, teacherId, updateAction, deleteAction, noCoursesLabel }: Props) {
  const [levelId, setLevelId] = useState("all");

  const visible = levelId === "all" ? courses : courses.filter((c) => c.levelId === levelId);

  const usedLevelIds = new Set(courses.map((c) => c.levelId));
  const usedLevels = levels.filter((l) => usedLevelIds.has(l.id));

  return (
    <div className="flex flex-col gap-3">
      {usedLevels.length > 1 && (
        <Select value={levelId} onValueChange={setLevelId}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {usedLevels.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{noCoursesLabel}</p>
      ) : (
        <div className="divide-y -mx-6 px-6">
          {visible.map((course) => (
            <CourseRow
              key={course.id}
              course={course}
              levels={levels}
              teacherId={teacherId}
              updateAction={updateAction}
              deleteAction={deleteAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
