"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentStatusChip } from "@/modules/payments/presentation/payment-status-chip";
import type { StudentRow } from "@/modules/roster/domain/student-row";
import type { ActionState } from "@/shared/domain/action-state";

type RosterRowProps = {
  readonly row: StudentRow;
  readonly markCashAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function RosterRow({ row, markCashAction }: RosterRowProps) {
  const [state, formAction, pending] = useActionState(markCashAction, {});

  return (
    <div className="flex items-center justify-between gap-4 border-b py-3">
      <div>
        <p className="text-sm font-medium">{row.studentEmail}</p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="secondary">{row.courseTitle}</Badge>
          <Badge variant="secondary">{row.sessionType === "ONLINE" ? "Online" : "Offline"}</Badge>
          <span className="text-xs text-muted-foreground">
            {row.attendedCount}/{row.totalSessions} attended
          </span>
        </div>
        {state.error ? (
          <p className="text-xs text-destructive">{state.error}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <PaymentStatusChip status={row.paymentStatus} />
        {row.paymentStatus === "UNPAID" ? (
          <form action={formAction}>
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              {pending ? "Marking…" : "Mark cash paid"}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
