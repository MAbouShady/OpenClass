import type { Payment } from "@/modules/payments/domain/payment";
import type { PaymentMethod, PaymentStatus } from "@/modules/payments/domain/payment-method";

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
  create(input: CreatePaymentInput): Promise<Payment>;
  approve(id: string, approvedById: string): Promise<Payment>;
}
