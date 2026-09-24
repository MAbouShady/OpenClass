import type { PaymentsReportCsvLabels } from "@/modules/payments/application/payments-report";

/** Minimal shape of a next-intl translator scoped to the `paymentsReport` namespace. */
type Translate = (key: string) => string;

/**
 * Localised headings and enum labels shared by the report page and the CSV export, so both always agree.
 *
 * @param t - Translator for the `paymentsReport` namespace.
 * @returns Labels in the shape the CSV serialiser expects.
 */
export function getReportLabels(t: Translate): PaymentsReportCsvLabels {
  return {
    columns: [
      t("colStudent"),
      t("colCode"),
      t("colCourse"),
      t("colLevel"),
      t("colMonth"),
      t("colMethod"),
      t("colStatus"),
      t("colAmount"),
      t("colPaidAt"),
    ],
    status: {
      APPROVED: t("statusApproved"),
      PENDING: t("statusPending"),
      UNPAID: t("statusUnpaid"),
    },
    method: { ONLINE: t("methodOnline"), CASH: t("methodCash"), NONE: t("methodNone") },
    total: t("total"),
    students: t("students"),
    byStatus: t("byStatus"),
    byMethod: t("byMethod"),
    byCourse: t("byCourse"),
    byLevel: t("byLevel"),
  };
}
