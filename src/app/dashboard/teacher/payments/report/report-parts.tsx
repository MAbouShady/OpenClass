import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { DataShell } from "@/components/common/data-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import type {
  PaymentsReport,
  PaymentsReportCsvLabels,
  PaymentsReportRow,
  ReportBucket,
} from "@/modules/payments/application/payments-report";
import { formatPaidAt, REPORT_SORT_KEYS, type ReportSortKey, } from "@/modules/payments/application/payments-report";

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
 * @param props.sort - Active sort and a link builder per column; omit for plain (non-clickable) headings, e.g. print.
 */
export function ReportTable(props: {
  readonly rows: readonly PaymentsReportRow[];
  readonly labels: PaymentsReportCsvLabels;
  readonly money: Money;
  readonly emptyLabel: string;
  readonly sort?: {
    readonly key: ReportSortKey | undefined;
    readonly dir: "asc" | "desc";
    readonly hrefFor: (key: ReportSortKey) => string;
    readonly ariaLabel: (column: string) => string;
  };
}) {
  const { rows, labels, money, emptyLabel, sort } = props;
  // Screen: nowrap + horizontal scroll (the results can be wide; scrolling beats squeezing). Print: a page can't
  // be scrolled, so cells wrap instead — combined with DataShell's print:overflow-visible and the smaller
  // print:text-[10px], all 8 columns end up visible on the printed/PDF page rather than a few being cut off.
  const cell = "whitespace-nowrap print:whitespace-normal print:break-words";
  return (
    <DataShell>
      <Table className="print:text-[10px]">
        <TableHeader>
          <TableRow>
            {labels.columns.map((c, i) => {
              // Columns and sort keys share one order, so the i-th heading sorts by the i-th key.
              const key = REPORT_SORT_KEYS[i]!;
              const active = sort?.key === key;
              const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
              return (
                <TableHead
                  key={c}
                  className={cell}
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                >
                  {sort ? (
                    <Link
                      href={sort.hrefFor(key)}
                      scroll={false}
                      aria-label={sort.ariaLabel(c)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {c}
                      <Icon size={12} className={active ? "" : "opacity-40"} />
                    </Link>
                  ) : (
                    c
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={labels.columns.length}
                className="py-8 text-center text-muted-foreground"
              >
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className={cn(cell, "font-medium")}>{r.studentName}</TableCell>
                <TableCell className={cell}>{r.studentIdNumber ?? "—"}</TableCell>
                <TableCell className={cell}>{r.courseName}</TableCell>
                <TableCell className={cell}>{r.levelName}</TableCell>
                <TableCell className={cell}>{r.month ?? "—"}</TableCell>
                <TableCell className={cell}>{labels.method[r.method ?? "NONE"]}</TableCell>
                <TableCell className={cell}>
                  {/* print-color-adjust keeps the badge colour in the printed PDF (browsers drop backgrounds by default). */}
                  <Badge
                    className="text-xs text-white [print-color-adjust:exact] print:text-[10px]"
                    style={{ backgroundColor: STATUS_COLOR[r.status] }}
                  >
                    {labels.status[r.status]}
                  </Badge>
                </TableCell>
                <TableCell className={cell}>{money(r.amount)}</TableCell>
                <TableCell className={cell} dir="ltr">
                  {formatPaidAt(r.paidAt) ?? "—"}
                </TableCell>
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
  const breakdowns: {
    title: string;
    buckets: readonly ReportBucket[];
    name: (b: ReportBucket) => string;
  }[] = [
    {
      title: labels.byStatus,
      buckets: report.byStatus,
      name: (b) => labels.status[b.key as keyof typeof labels.status],
    },
    {
      title: labels.byMethod,
      buckets: report.byMethod,
      name: (b) => labels.method[b.key as keyof typeof labels.method],
    },
    { title: labels.byCourse, buckets: report.byCourse, name: (b) => b.label },
    { title: labels.byLevel, buckets: report.byLevel, name: (b) => b.label },
  ];

  return (
    <Card className="break-inside-avoid">
      <CardHeader>
        <CardTitle>
          {labels.total}: {money(report.total.amount)} · {report.total.count} {countLabel} ·{" "}
          {report.total.students} {labels.students}
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
