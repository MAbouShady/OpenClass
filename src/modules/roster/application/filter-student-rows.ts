import type { SessionType } from "@/modules/courses/domain/session-type";
import type { PaymentStatus } from "@/modules/payments/domain/payment-method";
import type { StudentRow } from "@/modules/roster/domain/student-row";

export type StudentRowFilters = {
  readonly courseId?: string;
  readonly semesterId?: string;
  readonly sessionType?: SessionType;
  readonly paymentStatus?: PaymentStatus | "UNPAID";
};

export function filterStudentRows(
  rows: readonly StudentRow[],
  filters: StudentRowFilters,
): StudentRow[] {
  return rows.filter((row) => {
    if (filters.courseId && row.courseId !== filters.courseId) return false;
    if (filters.semesterId && row.semesterId !== filters.semesterId) return false;
    if (filters.sessionType && row.sessionType !== filters.sessionType) return false;
    if (filters.paymentStatus && row.paymentStatus !== filters.paymentStatus) return false;
    return true;
  });
}
