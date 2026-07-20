import type { SessionType } from "@/modules/courses/domain/session-type";
import type { PaymentFrequency } from "@/modules/courses/domain/payment-frequency";

export type Course = {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly price: number | null;
  readonly sessionType: SessionType;
  readonly paymentFrequency: PaymentFrequency;
  readonly isActive: boolean;
  readonly levelId: string;
  readonly teacherId: string;
};
