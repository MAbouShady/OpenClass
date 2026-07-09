import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ClassSession } from "@/modules/scheduling/domain/class-session";

type SessionRowProps = {
  readonly session: ClassSession;
  readonly deleteAction: (id: string) => Promise<void>;
};

function formatRange(start: Date, end: Date): string {
  const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
  const timeFormatter = new Intl.DateTimeFormat("en", { timeStyle: "short" });
  return `${dateFormatter.format(start)} – ${timeFormatter.format(end)}`;
}

export function SessionRow({ session, deleteAction }: SessionRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3">
      <p className="text-sm">{formatRange(session.startTime, session.endTime)}</p>
      <div className="flex gap-2">
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          href={`/dashboard/teacher/courses/${session.courseId}/sessions/${session.id}/attendance`}
        >
          Attendance
        </Link>
        <form action={deleteAction.bind(null, session.id)}>
          <Button type="submit" size="sm" variant="destructive">
            Delete
          </Button>
        </form>
      </div>
    </div>
  );
}
