import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import type { PaymentRepository } from "@/modules/payments/domain/payment-repository";

export type IsEnrollmentPaidForMonthDeps = {
  readonly paymentRepository: PaymentRepository;
};

export async function isEnrollmentPaidForMonth(
  deps: IsEnrollmentPaidForMonthDeps,
  enrollmentId: string,
  month: Date,
): Promise<boolean> {
  const payment = await deps.paymentRepository.findByEnrollmentAndMonth(
    enrollmentId,
    normalizeToMonthStart(month),
  );
  return payment?.status === "APPROVED";
}
