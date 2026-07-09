import type { SessionType } from "@/modules/courses/domain/session-type";
import type { PaymentStatus } from "@/modules/payments/domain/payment-method";

export type StudentRow = {
  readonly enrollmentId: string;
  readonly studentId: string;
  readonly studentEmail: string;
  readonly courseId: string;
  readonly courseTitle: string;
  readonly sessionType: SessionType;
  readonly semesterId: string;
  readonly paymentStatus: PaymentStatus | "UNPAID";
  readonly attendedCount: number;
  readonly totalSessions: number;
};
