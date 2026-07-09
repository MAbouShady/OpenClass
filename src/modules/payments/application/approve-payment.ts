import { err, ok, type Result } from "@/shared/domain/result";
import { PaymentNotFoundError } from "@/modules/payments/domain/errors";
import type { Payment } from "@/modules/payments/domain/payment";
import type { PaymentRepository } from "@/modules/payments/domain/payment-repository";
import {
  approvePaymentSchema,
  type ApprovePaymentSchemaInput,
} from "@/modules/payments/application/payment.schema";

export type ApprovePaymentDeps = {
  readonly paymentRepository: PaymentRepository;
};

export async function approvePayment(
  deps: ApprovePaymentDeps,
  input: ApprovePaymentSchemaInput,
): Promise<Result<Payment, PaymentNotFoundError>> {
  const { id, approvedById } = approvePaymentSchema.parse(input);

  const existing = await deps.paymentRepository.findById(id);
  if (!existing) {
    return err(new PaymentNotFoundError(id));
  }

  const payment = await deps.paymentRepository.approve(id, approvedById);
  return ok(payment);
}
