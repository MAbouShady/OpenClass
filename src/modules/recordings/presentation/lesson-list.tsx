"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, Circle, Play } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatDuration } from "@/modules/recordings/presentation/recorded-video-item";

export type StudentLessonItem = {
  readonly id: string;
  readonly title: string;
  readonly position: number;
  readonly durationSeconds: number | null;
  readonly completed: boolean;
  readonly progressPercent: number;
  readonly ready: boolean;
};

type LessonListProps = {
  /** Route prefix the lesson links hang off, e.g. `/student-portal/courses/x/lessons`. */
  readonly basePath: string;
  readonly lessons: readonly StudentLessonItem[];
  readonly activeLessonId?: string;
};

export function LessonList({ basePath, lessons, activeLessonId }: LessonListProps) {
  const t = useTranslations("recordings");

  if (lessons.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">{t("noLessonsYet")}</p>;
  }

  return (
    <ol className="flex flex-col gap-1">
      {lessons.map((lesson) => {
        const active = lesson.id === activeLessonId;
        return (
          <li key={lesson.id}>
            <Link
              href={`${basePath}/${lesson.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
              )}
            >
              <span className="mt-0.5 shrink-0">
                {lesson.completed ? (
                  <Check className="h-4 w-4 text-emerald-600" aria-label={t("completed")} />
                ) : active ? (
                  <Play className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/50" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {lesson.position}. {lesson.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {lesson.ready ? formatDuration(lesson.durationSeconds) : t("statusProcessing")}
                  {lesson.progressPercent > 0 && !lesson.completed
                    ? ` · ${lesson.progressPercent}%`
                    : ""}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
