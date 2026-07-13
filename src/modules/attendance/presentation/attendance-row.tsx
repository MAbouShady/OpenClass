"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AttendanceStatus } from "@/modules/attendance/domain/attendance";

type AttendanceRowProps = {
  readonly studentName: string;
  readonly studentIdNumber: number | null;
  readonly status: AttendanceStatus | "UNMARKED";
  readonly checkInTime: Date | null;
  readonly checkOutTime: Date | null;
  readonly markPresentAction: () => Promise<void>;
  readonly markAbsentAction: () => Promise<void>;
};

function formatTime(date: Date | null): string | null {
  return date
    ? new Intl.DateTimeFormat("ar-EG", { timeStyle: "short" }).format(date)
    : null;
}

export function AttendanceRow({
  studentName,
  studentIdNumber,
  status,
  checkInTime,
  checkOutTime,
  markPresentAction,
  markAbsentAction,
}: AttendanceRowProps) {
  const t = useTranslations("attendance");
  const checkIn = formatTime(checkInTime);
  const checkOut = formatTime(checkOutTime);

  const badgeVariant =
    status === "PRESENT" ? "success" : status === "ABSENT" ? "destructive" : "secondary";

  const badgeLabel =
    status === "PRESENT" ? t("present") : status === "ABSENT" ? t("absent") : t("unmarked");

  return (
    <div className="flex items-center justify-between gap-4 border-b py-3">
      <div>
        <p className="text-sm font-medium">{studentName}</p>
        <p className="text-xs text-muted-foreground">
          {studentIdNumber != null ? `#${studentIdNumber}` : t("noId")}
          {checkIn ? ` · ${checkIn}${checkOut ? ` · ${checkOut}` : ""}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
        <form action={markPresentAction}>
          <Button type="submit" size="sm" variant="outline">
            {t("present")}
          </Button>
        </form>
        <form action={markAbsentAction}>
          <Button type="submit" size="sm" variant="destructive">
            {t("absent")}
          </Button>
        </form>
      </div>
    </div>
  );
}
