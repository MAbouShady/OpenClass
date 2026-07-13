"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentStatusChip } from "@/modules/payments/presentation/payment-status-chip";
import type { StudentRow } from "@/modules/roster/domain/student-row";
import type { ActionState } from "@/shared/domain/action-state";

type RosterRowProps = {
  readonly row: StudentRow;
  readonly markCashAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly unenrollAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function RosterRow({ row, markCashAction, unenrollAction }: RosterRowProps) {
  const t = useTranslations("roster");
  const [state, formAction, pending] = useActionState(markCashAction, {});
  const [unenrollState, unenrollFormAction, unenrollPending] = useActionState(unenrollAction, {});
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 border-b py-3">
      <div>
        <p className="text-sm font-medium">
          {row.studentName ?? row.studentEmail}
          {row.studentIdNumber !== null ? (
            <span className="ms-1.5 font-mono text-xs text-muted-foreground">#{row.studentIdNumber}</span>
          ) : null}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="secondary">{row.courseTitle}</Badge>
          <Badge variant="secondary">{row.sessionType === "ONLINE" ? t("online") : t("offline")}</Badge>
          <span className="text-xs text-muted-foreground">
            {t("attended", { attended: row.attendedCount, total: row.totalSessions })}
          </span>
        </div>
        {state.error ? (
          <p className="text-xs text-destructive">{state.error}</p>
        ) : null}
        {unenrollState.error ? (
          <p className="text-xs text-destructive">{unenrollState.error}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <PaymentStatusChip status={row.paymentStatus} />
        {row.paymentStatus === "UNPAID" ? (
          <form action={formAction}>
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              {pending ? t("marking") : t("markCashPaid")}
            </Button>
          </form>
        ) : null}
        {confirming ? (
          <form action={unenrollFormAction} className="flex items-center gap-1">
            <input type="hidden" name="enrollmentId" value={row.enrollmentId} />
            <span className="text-xs text-muted-foreground">{t("unassignConfirm")}</span>
            <Button type="submit" size="sm" variant="destructive" disabled={unenrollPending}>
              {unenrollPending ? t("unassigning") : t("yes")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              {t("no")}
            </Button>
          </form>
        ) : (
          <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
            {t("unassign")}
          </Button>
        )}
      </div>
    </div>
  );
}
