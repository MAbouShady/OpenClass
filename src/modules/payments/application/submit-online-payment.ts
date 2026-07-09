import { err, ok, type Result } from "@/shared/domain/result";
import { PaymentAlreadyExistsError } from "@/modules/payments/domain/errors";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import type { Payment } from "@/modules/payments/domain/payment";
import type { PaymentRepository } from "@/modules/payments/domain/payment-repository";
import {
  submitOnlinePaymentSchema,
  type SubmitOnlinePaymentSchemaInput,
} from "@/modules/payments/application/payment.schema";

export type SubmitOnlinePaymentDeps = {
  readonly paymentRepository: PaymentRepository;
};

export async function submitOnlinePayment(
  deps: SubmitOnlinePaymentDeps,
  input: SubmitOnlinePaymentSchemaInput,
): Promise<Result<Payment, PaymentAlreadyExistsError>> {
  const parsed = submitOnlinePaymentSchema.parse(input);
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
    method: "ONLINE",
    status: "PENDING",
    proofUrl: parsed.proofUrl,
    approvedById: null,
    notes: parsed.notes,
  });

  return ok(payment);
}
