"use client";

import { useTranslations } from "next-intl";

type CourseProgressBarProps = {
  readonly percent: number;
  readonly completedLessons: number;
  readonly totalLessons: number;
};

/** Course progress, always rendered from server-computed numbers. */
export function CourseProgressBar({
  percent,
  completedLessons,
  totalLessons,
}: CourseProgressBarProps) {
  const t = useTranslations("recordings");

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{t("courseProgress")}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {percent}% · {t("lessonsCompleted", { completed: completedLessons, total: totalLessons })}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
