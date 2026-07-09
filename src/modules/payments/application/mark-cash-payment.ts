import { err, ok, type Result } from "@/shared/domain/result";
import { PaymentAlreadyExistsError } from "@/modules/payments/domain/errors";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import type { Payment } from "@/modules/payments/domain/payment";
import type { PaymentRepository } from "@/modules/payments/domain/payment-repository";
import {
  markCashPaymentSchema,
  type MarkCashPaymentSchemaInput,
} from "@/modules/payments/application/payment.schema";

export type MarkCashPaymentDeps = {
  readonly paymentRepository: PaymentRepository;
};

export async function markCashPayment(
  deps: MarkCashPaymentDeps,
  input: MarkCashPaymentSchemaInput,
): Promise<Result<Payment, PaymentAlreadyExistsError>> {
  const parsed = markCashPaymentSchema.parse(input);
  const month = normalizeToMonthStart(parsed.month);

  const existing = await deps.paymentRepository.findByEnrollmentAndMonth(
    parsed.enrollmentId,
    month,
  );
  if (existing) {
    return err(new PaymentAlreadyExistsError());
  }

  const payment = await deps.paymentRepository.create({
    enrollmentId: parsed.enrollmentId,
    month,
    method: "CASH",
    status: "APPROVED",
    proofUrl: null,
    approvedById: parsed.approvedById,
    notes: parsed.notes,
  });

  return ok(payment);
}
