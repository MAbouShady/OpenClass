"use client";

import { useTranslations } from "next-intl";
import { CalendarClock, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CourseAccess } from "@/modules/recordings/domain/course-access-rules";

type CourseAccessNoticeProps = {
  readonly access: CourseAccess;
};

/** Egypt time, matching how the rest of the app presents dates to families. */
function formatDate(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "Africa/Cairo",
  }).format(value);
}

function formatMonth(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(value);
}

/**
 * Explains why a lesson is locked. Students are told what to do — pay for the
 * month, or wait for the start date — rather than being shown a bare refusal.
 */
export function CourseAccessNotice({ access }: CourseAccessNoticeProps) {
  const t = useTranslations("recordings");
  const locale = useTranslations("common")("localeTag");

  if (access.granted) return null;

  if (access.reason === "NOT_STARTED") {
    return (
      <Alert>
        <CalendarClock className="h-4 w-4" />
        <AlertDescription>
          {access.startsAt
            ? t("lockedNotStartedOn", { date: formatDate(access.startsAt, locale) })
            : t("lockedNotStarted")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <Lock className="h-4 w-4" />
      <AlertDescription>
        {access.owedMonth
          ? t("lockedUnpaidMonth", { month: formatMonth(access.owedMonth, locale) })
          : t("lockedUnpaid")}
      </AlertDescription>
    </Alert>
  );
}
