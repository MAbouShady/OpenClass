import type { Payment } from "@/modules/payments/domain/payment";
import type { PaymentMethod, PaymentStatus } from "@/modules/payments/domain/payment-method";

export type PaymentRow = {
  readonly id: string;
  readonly month: Date;
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly proofUrl: string | null;
  readonly notes: string | null;
};

export type PaymentWithContext = {
  readonly id: string | null;
  readonly enrollmentId: string;
  readonly month: Date | null;
  readonly method: PaymentMethod | null;
  readonly status: PaymentStatus | "UNPAID";
  readonly proofUrl: string | null;
  readonly notes: string | null;
  readonly studentName: string;
  readonly studentIdNumber: number | null;
  readonly courseName: string;
  readonly coursePrice: number | null;
};

export type EnrollmentPaymentSummary = {
  readonly enrollmentId: string;
  readonly studentName: string;
  readonly studentIdNumber: number | null;
  readonly courseId: string;
  readonly courseName: string;
  readonly coursePrice: number | null;
  readonly paymentFrequency: "ONE_TIME" | "MONTHLY" | "PER_SEMESTER" | null;
  readonly levelId: string;
  readonly levelName: string;
  readonly latestPayment: PaymentRow | null;
  readonly allPayments: readonly PaymentRow[];
};

export type CreatePaymentInput = {
  readonly enrollmentId: string;
  readonly month: Date;
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly proofUrl: string | null;
  readonly approvedById: string | null;
  readonly notes: string | null;
};

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByEnrollmentAndMonth(enrollmentId: string, month: Date): Promise<Payment | null>;
  findByEnrollment(enrollmentId: string): Promise<Payment[]>;
  findAllForTeacher(teacherId: string): Promise<PaymentWithContext[]>;
  findEnrollmentSummariesForTeacher(teacherId: string): Promise<EnrollmentPaymentSummary[]>;
  create(input: CreatePaymentInput): Promise<Payment>;
  approve(id: string, approvedById: string): Promise<Payment>;
  delete(id: string): Promise<void>;
}
