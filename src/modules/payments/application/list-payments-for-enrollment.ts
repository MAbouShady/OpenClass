import type { Payment } from "@/modules/payments/domain/payment";
import type { PaymentRepository } from "@/modules/payments/domain/payment-repository";

export type ListPaymentsForEnrollmentDeps = {
  readonly paymentRepository: PaymentRepository;
};

export function listPaymentsForEnrollment(
  deps: ListPaymentsForEnrollmentDeps,
  enrollmentId: string,
): Promise<Payment[]> {
  return deps.paymentRepository.findByEnrollment(enrollmentId);
}
