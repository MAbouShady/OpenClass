import { Badge } from "@/components/ui/badge";
import { PaymentStatusChip } from "@/modules/payments/presentation/payment-status-chip";
import type { StudentCourseSummary } from "@/modules/roster/application/get-student-course-summaries";

type CourseSummaryListProps = {
  readonly courses: readonly StudentCourseSummary[];
  readonly emptyMessage: string;
};

export function CourseSummaryList({ courses, emptyMessage }: CourseSummaryListProps) {
  if (courses.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div>
      {courses.map((course, index) => (
        <div
          key={index}
          className="flex items-center justify-between border-b border-border py-3 last:border-b-0"
        >
          <div className="flex flex-row items-center gap-2">
            <span className="text-sm">{course.courseTitle}</span>
            <Badge variant="outline">
              {course.sessionType === "ONLINE" ? "Online" : "Offline"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {course.attendedCount}/{course.totalSessions} attended
            </span>
          </div>
          <PaymentStatusChip status={course.paymentStatus} />
        </div>
      ))}
    </div>
  );
}
