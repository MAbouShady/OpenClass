import { isEnrollmentPaidForMonth } from "@/modules/payments/application/is-enrollment-paid-for-month";
import type { PaymentRepository } from "@/modules/payments/domain/payment-repository";

export type IsEnrollmentBlockedDeps = {
  readonly paymentRepository: PaymentRepository;
};

/**
 * A student is blocked from attendance whenever the current calendar month
 * has no approved payment against their semester enrollment.
 */
export async function isEnrollmentBlocked(
  deps: IsEnrollmentBlockedDeps,
  enrollmentId: string,
  asOf: Date,
): Promise<boolean> {
  const paid = await isEnrollmentPaidForMonth(deps, enrollmentId, asOf);
  return !paid;
}
