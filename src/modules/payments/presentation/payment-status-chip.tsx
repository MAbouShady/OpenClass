"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/modules/payments/domain/payment-method";

type PaymentStatusChipProps = { readonly status: PaymentStatus | "UNPAID"; };

export function PaymentStatusChip({ status }: PaymentStatusChipProps) {
  const t = useTranslations("roster");

  if (status === "APPROVED") return <Badge variant="success">{t("paid")}</Badge>;
  if (status === "PENDING") return <Badge variant="warning">{t("pending")}</Badge>;
  return <Badge variant="secondary">{t("unpaid")}</Badge>;
}
