import type { PaymentMethod, PaymentStatus } from "@/modules/payments/domain/payment-method";

export type Payment = {
  readonly id: string;
  readonly enrollmentId: string;
  readonly month: Date;
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly proofUrl: string | null;
  readonly approvedById: string | null;
  readonly notes: string | null;
};
