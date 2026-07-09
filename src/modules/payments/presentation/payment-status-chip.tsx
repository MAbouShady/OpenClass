import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/modules/payments/domain/payment-method";

type PaymentStatusChipProps = { readonly status: PaymentStatus | "UNPAID"; };

export function PaymentStatusChip({ status }: PaymentStatusChipProps) {
  if (status === "APPROVED") return <Badge variant="success">Paid</Badge>;
  if (status === "PENDING") return <Badge variant="warning">Pending</Badge>;
  return <Badge variant="secondary">Unpaid</Badge>;
}
