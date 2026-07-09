"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentStatusChip } from "@/modules/payments/presentation/payment-status-chip";
import type { PaymentStatus } from "@/modules/payments/domain/payment-method";
import type { ActionState } from "@/shared/domain/action-state";

type EnrollmentPaymentRowProps = {
  readonly studentEmail: string;
  readonly status: PaymentStatus | "UNPAID";
  readonly pendingPaymentId: string | null;
  readonly markCashAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly approveAction: (id: string) => Promise<void>;
};

export function EnrollmentPaymentRow({
  studentEmail,
  status,
  pendingPaymentId,
  markCashAction,
  approveAction,
}: EnrollmentPaymentRowProps) {
  const [state, formAction, pending] = useActionState(markCashAction, {});

  return (
    <div className="flex items-center justify-between border-b py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm">{studentEmail}</span>
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <PaymentStatusChip status={status} />
        {status === "UNPAID" ? (
          <form action={formAction}>
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              {pending ? "Marking…" : "Mark cash paid"}
            </Button>
          </form>
        ) : null}
        {status === "PENDING" && pendingPaymentId ? (
          <form action={approveAction.bind(null, pendingPaymentId)}>
            <Button type="submit" size="sm">Approve</Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
