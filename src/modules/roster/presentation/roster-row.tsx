"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
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

  const error = state.error ?? unenrollState.error;

  return (
    <TableRow>
      <TableCell className="max-w-[16rem]">
        <div className="truncate font-medium">{row.studentName ?? row.studentEmail}</div>
        {row.studentIdNumber !== null ? (
          <div className="font-mono text-xs text-muted-foreground">#{row.studentIdNumber}</div>
        ) : null}
        {/* Action errors belong beside the row that produced them. */}
        {error ? <div className="mt-1 text-xs text-destructive">{error}</div> : null}
      </TableCell>

      <TableCell className="max-w-[14rem]">
        <span className="block truncate text-sm">{row.courseTitle}</span>
      </TableCell>

      <TableCell>
        <Badge variant={row.sessionType === "ONLINE" ? "default" : "secondary"}>
          {row.sessionType === "ONLINE" ? t("online") : t("offline")}
        </Badge>
      </TableCell>

      <TableCell className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
        {t("attended", { attended: row.attendedCount, total: row.totalSessions })}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <PaymentStatusChip status={row.paymentStatus} />
          {row.paymentStatus === "UNPAID" ? (
            <form action={formAction}>
              <Button type="submit" size="sm" variant="outline" disabled={pending}>
                {pending ? t("marking") : t("markCashPaid")}
              </Button>
            </form>
          ) : null}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-end gap-1">
          {confirming ? (
            <form action={unenrollFormAction} className="flex items-center gap-1">
              <input type="hidden" name="enrollmentId" value={row.enrollmentId} />
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {t("unassignConfirm")}
              </span>
              <Button type="submit" size="sm" variant="destructive" disabled={unenrollPending}>
                {unenrollPending ? t("unassigning") : t("yes")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                {t("no")}
              </Button>
            </form>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirming(true)}
            >
              {t("unassign")}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
