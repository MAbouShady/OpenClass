"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

type LessonNavProps = {
  /** Route prefix the lesson links hang off. */
  readonly basePath: string;
  readonly previousLessonId: string | null;
  readonly nextLessonId: string | null;
};

/** Navigation follows the stored `position` order resolved on the server. */
export function LessonNav({ basePath, previousLessonId, nextLessonId }: LessonNavProps) {
  const t = useTranslations("recordings");
  const base = basePath;

  return (
    <div className="flex items-center justify-between gap-3">
      {previousLessonId ? (
        <Link
          href={`${base}/${previousLessonId}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <ChevronLeft className="h-4 w-4" />
          {t("previousLesson")}
        </Link>
      ) : (
        <span />
      )}

      {nextLessonId ? (
        <Link
          href={`${base}/${nextLessonId}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          {t("nextLesson")}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
