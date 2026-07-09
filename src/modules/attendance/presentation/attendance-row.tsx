import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AttendanceStatus } from "@/modules/attendance/domain/attendance";

type AttendanceRowProps = {
  readonly studentEmail: string;
  readonly status: AttendanceStatus | "UNMARKED";
  readonly checkInTime: Date | null;
  readonly checkOutTime: Date | null;
  readonly markPresentAction: () => Promise<void>;
  readonly markAbsentAction: () => Promise<void>;
};

function formatTime(date: Date | null): string | null {
  return date ? new Intl.DateTimeFormat("en", { timeStyle: "short" }).format(date) : null;
}

export function AttendanceRow({
  studentEmail,
  status,
  checkInTime,
  checkOutTime,
  markPresentAction,
  markAbsentAction,
}: AttendanceRowProps) {
  const checkIn = formatTime(checkInTime);
  const checkOut = formatTime(checkOutTime);

  const badgeVariant =
    status === "PRESENT" ? "success" : status === "ABSENT" ? "destructive" : "secondary";

  const badgeLabel =
    status === "PRESENT" ? "Present" : status === "ABSENT" ? "Absent" : "Unmarked";

  return (
    <div className="flex items-center justify-between gap-4 border-b py-3">
      <div>
        <p className="text-sm">{studentEmail}</p>
        {checkIn ? (
          <p className="text-xs text-muted-foreground">
            In {checkIn}
            {checkOut ? ` · Out ${checkOut}` : ""}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
        <form action={markPresentAction}>
          <Button type="submit" size="sm" variant="outline">
            Present
          </Button>
        </form>
        <form action={markAbsentAction}>
          <Button type="submit" size="sm" variant="destructive">
            Absent
          </Button>
        </form>
      </div>
    </div>
  );
}
