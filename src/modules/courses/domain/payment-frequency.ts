export const PAYMENT_FREQUENCIES = ["ONE_TIME", "MONTHLY", "PER_SEMESTER"] as const;
export type PaymentFrequency = (typeof PAYMENT_FREQUENCIES)[number];

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  ONE_TIME: "One-time",
  MONTHLY: "Monthly",
  PER_SEMESTER: "Per semester",
};
