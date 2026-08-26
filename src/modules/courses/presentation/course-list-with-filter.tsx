"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourseCard } from "@/modules/courses/presentation/course-card";
import type { Course } from "@/modules/courses/domain/course";
import type { Level } from "@/modules/levels/domain/level";
import type { ActionState } from "@/shared/domain/action-state";

const ALL = "all";

export type CourseStudentCountsMap = Readonly<
  Record<string, { readonly enrolled: number; readonly paid: number }>
>;

type Props = {
  readonly courses: readonly Course[];
  readonly counts: CourseStudentCountsMap;
  readonly levels: readonly Level[];
  readonly teacherId: string;
  readonly updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly deleteAction: (id: string) => Promise<void>;
  readonly noCoursesLabel: string;
};

export function CourseListWithFilter({
  courses,
  counts,
  levels,
  teacherId,
  updateAction,
  deleteAction,
  noCoursesLabel,
}: Props) {
  const t = useTranslations("courses");
  const [query, setQuery] = useState("");
  const [levelId, setLevelId] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const usedLevelIds = new Set(courses.map((course) => course.levelId));
  const usedLevels = levels.filter((level) => usedLevelIds.has(level.id));
  const hasInactive = courses.some((course) => !course.isActive);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (levelId !== ALL && course.levelId !== levelId) return false;
      if (status === "active" && !course.isActive) return false;
      if (status === "inactive" && course.isActive) return false;
      if (!needle) return true;
      return (
        course.title.toLowerCase().includes(needle) ||
        (course.description ?? "").toLowerCase().includes(needle)
      );
    });
  }, [courses, query, levelId, status]);

  // The toolbar only earns its space once there is something to sift through.
  const showToolbar = courses.length > 3 || usedLevels.length > 1 || hasInactive;

  if (courses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-14 text-center">
        <BookOpen className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{noCoursesLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {showToolbar && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="h-9 ps-9"
            />
          </div>

          {usedLevels.length > 1 && (
            <Select value={levelId} onValueChange={setLevelId}>
              <SelectTrigger className="h-9 sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("allLevels")}</SelectItem>
                {usedLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasInactive && (
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("allStatuses")}</SelectItem>
                <SelectItem value="active">{t("statusActive")}</SelectItem>
                <SelectItem value="inactive">{t("inactiveLabel")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
          <SlidersHorizontal className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("noMatches")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              counts={counts[course.id]}
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
