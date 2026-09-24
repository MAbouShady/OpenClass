import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { LinkButton } from "@/components/common/link-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import {
  buildPaymentsReport,
  currentMonthKey,
  parsePaymentsReportFilters,
} from "@/modules/payments/application/payments-report";
import { getReportLabels } from "./labels";
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from "./page-size";
import { PaginationBar } from "./pagination";
import { PrintButton } from "./print-button";
import { ReportTable, ReportTotals } from "./report-parts";

const paymentRepository = new PrismaPaymentRepository();

/** Same look as the shared `Input`, for the native `<select>`s (keeps this page a plain server component). */
const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring";

type PageProps = { readonly searchParams: Promise<Record<string, string | undefined>> };

/**
 * Payments report: filter form, results table and totals. The same filters drive the CSV export
 * (`/api/payments-report`) and the print stylesheet ("Save as PDF").
 */
export default async function PaymentsReportPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) notFound();

  const params = await searchParams;
  const [summaries, t, locale] = await Promise.all([
    paymentRepository.findEnrollmentSummariesForTeacher(session.user.id),
    getTranslations("paymentsReport"),
    getLocale(),
  ]);

  // The filter form has never been submitted (no field of its own in the URL) → default the month range to the
  // current month. Once submitted, an explicitly empty from/to (the user cleared it) means "all time" and is
  // respected as-is, never snapped back to this default.
  const FILTER_FORM_KEYS = ["status", "method", "courseId", "levelId", "from", "to", "q"] as const;
  const filterFormSubmitted = FILTER_FORM_KEYS.some((key) => params[key] !== undefined);
  const filters = {
    ...parsePaymentsReportFilters(params),
    ...(filterFormSubmitted ? {} : { from: currentMonthKey(), to: currentMonthKey() }),
  };
  const report = buildPaymentsReport(summaries, filters);
  const labels = getReportLabels(t);
  const money = (n: number) => n.toLocaleString(locale);
  // Explicit (not just inherited from <html>) so the on-screen report and the printed PDF always follow the UI language.
  const dir = locale === "ar" ? "rtl" : "ltr";

  const courses = [...new Map(summaries.map((s) => [s.courseId, s.courseName])).entries()];
  const levels = [...new Map(summaries.map((s) => [s.levelId, s.levelName])).entries()];
  // Only the filters that are actually set, forwarded verbatim to the CSV endpoint.
  const csvQuery = new URLSearchParams(
    Object.entries(filters).map(([k, v]) => [k, String(v)] as [string, string]),
  ).toString();

  // Paginate after totals are computed: statistics cover every filtered row, the table shows one page.
  // Default is "10" (the first option); an unrecognised value (hand-edited URL) also falls back to it.
  const pageSize: PageSizeOption = (PAGE_SIZE_OPTIONS as readonly string[]).includes(
    params.pageSize ?? "",
  )
    ? (params.pageSize as PageSizeOption)
    : "10";
  const rowsPerPage = pageSize === "all" ? Math.max(report.rows.length, 1) : Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(report.rows.length / rowsPerPage));
  const safePage = Math.min(Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1), totalPages);
  const pageRows =
    pageSize === "all"
      ? report.rows
      : report.rows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <div dir={dir} className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Landscape gives 8 columns room to fit without shrinking further; scoped to this page only. */}
      <style>{"@media print { @page { size: landscape; margin: 12mm; } }"}</style>
      <div className="print:hidden">
        <PageHeader
          icon={<FileText className="h-5 w-5" />}
          title={t("pageTitle")}
          subtitle={t("pageSubtitle")}
          tone="amber"
          actions={
            <div className="flex flex-wrap gap-2">
              <LinkButton href={`/api/payments-report?${csvQuery}`} variant="outline">
                {t("exportCsv")}
              </LinkButton>
              <PrintButton label={t("exportPdf")} />
            </div>
          }
        />
      </div>

      {/* Print-only heading (the interactive header above is hidden when printing). */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold">{t("pageTitle")}</h1>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString(locale)} · {session.user.name}
        </p>
      </div>

      {/* Filters: a plain GET form, so the URL is the single source of truth (shareable, and reused by the CSV link). */}
      <form method="GET" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <Input
          name="q"
          defaultValue={filters.q}
          placeholder={t("searchPlaceholder")}
          className="h-9"
        />
        <select name="status" defaultValue={filters.status ?? ""} className={SELECT_CLASS}>
          <option value="">{t("allStatuses")}</option>
          <option value="APPROVED">{labels.status.APPROVED}</option>
          <option value="PENDING">{labels.status.PENDING}</option>
          <option value="UNPAID">{labels.status.UNPAID}</option>
        </select>
        <select name="method" defaultValue={filters.method ?? ""} className={SELECT_CLASS}>
          <option value="">{t("allMethods")}</option>
          <option value="ONLINE">{labels.method.ONLINE}</option>
          <option value="CASH">{labels.method.CASH}</option>
        </select>
        <select name="courseId" defaultValue={filters.courseId ?? ""} className={SELECT_CLASS}>
          <option value="">{t("allCourses")}</option>
          {courses.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select name="levelId" defaultValue={filters.levelId ?? ""} className={SELECT_CLASS}>
          <option value="">{t("allLevels")}</option>
          {levels.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {t("from")}
          <Input type="month" name="from" defaultValue={filters.from} className="h-9" />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {t("to")}
          <Input type="month" name="to" defaultValue={filters.to} className="h-9" />
        </label>
        <div className="flex gap-2">
          <Button type="submit">{t("apply")}</Button>
          <LinkButton href="/dashboard/teacher/payments/report" variant="ghost">
            {t("reset")}
          </LinkButton>
        </div>
      </form>

      {/* Statistics first: grand total, then a breakdown per status / method / course / level. */}
      <ReportTotals report={report} labels={labels} money={money} countLabel={t("payments")} />

      {/* Screen: one page of rows. Print: every row (the PDF should be the full report, not just page N). */}
      <div className="print:hidden">
        <ReportTable rows={pageRows} labels={labels} money={money} emptyLabel={t("noResults")} />
        <PaginationBar
          hasRows={report.rows.length > 0}
          pageSize={pageSize}
          pageSizeLabel={t("rowsPerPage")}
          allLabel={t("showAll")}
          page={safePage}
          totalPages={totalPages}
          query={params}
          pageLabel={t("pageOf", { page: safePage, total: totalPages })}
          prev={t("previous")}
          next={t("next")}
        />
      </div>
      <div className="hidden print:block">
        <ReportTable rows={report.rows} labels={labels} money={money} emptyLabel={t("noResults")} />
      </div>
    </div>
  );
}
