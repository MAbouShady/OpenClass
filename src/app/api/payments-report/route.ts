import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import {
  buildPaymentsReport,
  parsePaymentsReportFilters,
  paymentsReportToCsv,
} from "@/modules/payments/application/payments-report";
import { getReportLabels } from "@/app/dashboard/teacher/payments/report/labels";

const paymentRepository = new PrismaPaymentRepository();

/**
 * CSV export of the payments report. Takes the same query params as the report page, so the file always matches
 * what is on screen. Re-checks the session itself: `proxy.ts` is only a coarse route gate.
 *
 * @param request - `GET /api/payments-report?status=&method=&courseId=&levelId=&from=&to=&q=`
 * @returns A UTF-8 (BOM) CSV attachment, or 401/403.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [summaries, t] = await Promise.all([
    paymentRepository.findEnrollmentSummariesForTeacher(session.user.id),
    getTranslations("paymentsReport"),
  ]);
  const filters = parsePaymentsReportFilters(Object.fromEntries(request.nextUrl.searchParams));
  const csv = paymentsReportToCsv(buildPaymentsReport(summaries, filters), getReportLabels(t));

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payments-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
