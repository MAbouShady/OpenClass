import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DataShell } from "@/components/common/data-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  PaymentsReport,
  PaymentsReportCsvLabels,
  PaymentsReportRow,
  ReportBucket,
} from "@/modules/payments/application/payments-report";

/** Same status colours as the payments list (`payment-list.tsx`): approved green, pending amber, unpaid red. */
const STATUS_COLOR = { APPROVED: "#16a34a", PENDING: "#ca8a04", UNPAID: "#dc2626" } as const;

type Money = (n: number) => string;

/**
 * The report's rows as a table.
 *
 * @param props.rows - Rows to show (one page on screen, all rows for print).
 * @param props.labels - Localised column headings and enum labels.
 * @param props.money - Locale-aware number formatter.
 * @param props.emptyLabel - Text shown when there are no rows.
 */
export function ReportTable(props: {
  readonly rows: readonly PaymentsReportRow[];
  readonly labels: PaymentsReportCsvLabels;
  readonly money: Money;
  readonly emptyLabel: string;
}) {
  const { rows, labels, money, emptyLabel } = props;
  return (
    <DataShell>
      <Table>
        <TableHeader>
          <TableRow>
            {labels.columns.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={labels.columns.length} className="py-8 text-center text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{r.studentName}</TableCell>
                <TableCell>{r.studentIdNumber ?? "—"}</TableCell>
                <TableCell>{r.courseName}</TableCell>
                <TableCell>{r.levelName}</TableCell>
                <TableCell>{r.month ?? "—"}</TableCell>
                <TableCell>{labels.method[r.method ?? "NONE"]}</TableCell>
                <TableCell>
                  {/* print-color-adjust keeps the badge colour in the printed PDF (browsers drop backgrounds by default). */}
                  <Badge
                    className="text-xs text-white [print-color-adjust:exact]"
                    style={{ backgroundColor: STATUS_COLOR[r.status] }}
                  >
                    {labels.status[r.status]}
                  </Badge>
                </TableCell>
                <TableCell>{money(r.amount)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </DataShell>
  );
}

/**
 * Statistics card: grand total (amount and count) and a breakdown per status, method, course and level.
 * Always reflects the whole filtered result, not just the visible page.
 */
export function ReportTotals(props: {
  readonly report: PaymentsReport;
  readonly labels: PaymentsReportCsvLabels;
  readonly money: Money;
  readonly countLabel: string;
}) {
  const { report, labels, money, countLabel } = props;
  const breakdowns: { title: string; buckets: readonly ReportBucket[]; name: (b: ReportBucket) => string }[] = [
    { title: labels.byStatus, buckets: report.byStatus, name: (b) => labels.status[b.key as keyof typeof labels.status] },
    { title: labels.byMethod, buckets: report.byMethod, name: (b) => labels.method[b.key as keyof typeof labels.method] },
    { title: labels.byCourse, buckets: report.byCourse, name: (b) => b.label },
    { title: labels.byLevel, buckets: report.byLevel, name: (b) => b.label },
  ];

  return (
    <Card className="break-inside-avoid">
      <CardHeader>
        <CardTitle>
          {labels.total}: {money(report.total.amount)} · {report.total.count} {countLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        {breakdowns.map(({ title, buckets, name }) => (
          <div key={title} className="break-inside-avoid">
            <h3 className="mb-2 text-sm font-semibold">{title}</h3>
            <table className="w-full text-sm">
              <tbody>
                {buckets.map((b) => (
                  <tr key={b.key} className="border-b last:border-0">
                    <td className="py-1">{name(b)}</td>
                    <td className="py-1 text-end text-muted-foreground">{b.count}</td>
                    <td className="py-1 text-end font-medium">{money(b.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Previous/next links that keep every active filter and only change `page`. Chevrons flip in RTL.
 * Renders nothing when there is a single page.
 */
export function Pagination(props: {
  readonly page: number;
  readonly totalPages: number;
  readonly query: Readonly<Record<string, string | undefined>>;
  readonly label: string;
  readonly prev: string;
  readonly next: string;
}) {
  const { page, totalPages, query, label, prev, next } = props;
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams(
      Object.entries(query).filter(([k, v]) => k !== "page" && v) as [string, string][],
    );
    params.set("page", String(target));
    return `?${params.toString()}`;
  };
  const btn = buttonVariants({ variant: "outline", size: "sm" });
  const off = `${btn} pointer-events-none opacity-40`;

  return (
    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
      <span>{label}</span>
      <div className="flex gap-1">
        {page > 1 ? (
          <Link href={href(page - 1)} className={btn} aria-label={prev}>
            <ChevronLeft size={14} className="rtl:rotate-180" />
          </Link>
        ) : (
          <span className={off}><ChevronLeft size={14} className="rtl:rotate-180" /></span>
        )}
        {page < totalPages ? (
          <Link href={href(page + 1)} className={btn} aria-label={next}>
            <ChevronRight size={14} className="rtl:rotate-180" />
          </Link>
        ) : (
          <span className={off}><ChevronRight size={14} className="rtl:rotate-180" /></span>
        )}
      </div>
    </div>
  );
}
