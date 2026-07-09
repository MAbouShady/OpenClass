export const PAYMENT_METHODS = ["ONLINE", "CASH"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["PENDING", "APPROVED"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
