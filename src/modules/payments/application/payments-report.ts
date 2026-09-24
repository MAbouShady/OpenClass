import { z } from "zod";
import type { EnrollmentPaymentSummary } from "@/modules/payments/domain/payment-repository";
import type { PaymentMethod } from "@/modules/payments/domain/payment-method";

/** Report status: a stored payment status, or `UNPAID` for an enrollment with no payment record at all. */
export type ReportStatus = "APPROVED" | "PENDING" | "UNPAID";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Columns the table can be sorted by, in display order (the CSV/table columns follow the same order). */
export const REPORT_SORT_KEYS = [
  "student",
  "code",
  "course",
  "level",
  "month",
  "method",
  "status",
  "amount",
  "paidAt",
] as const;
export type ReportSortKey = (typeof REPORT_SORT_KEYS)[number];

/**
 * Query-string shape of the report. Every field is optional and an invalid value is dropped (`catch`)
 * rather than rejected, so a hand-edited URL degrades to "no filter" instead of erroring.
 */
export const paymentsReportFiltersSchema = z.object({
  status: z.enum(["APPROVED", "PENDING", "UNPAID"]).optional().catch(undefined),
  method: z.enum(["ONLINE", "CASH"]).optional().catch(undefined),
  courseId: z.string().min(1).optional().catch(undefined),
  levelId: z.string().min(1).optional().catch(undefined),
  /** Inclusive lower bound, `YYYY-MM`. */
  from: z.string().regex(MONTH).optional().catch(undefined),
  /** Inclusive upper bound, `YYYY-MM`. */
  to: z.string().regex(MONTH).optional().catch(undefined),
  /** Free text matched against student name/code, course, level and notes. */
  q: z.string().trim().min(1).max(100).optional().catch(undefined),
  /** Column to sort by; unset keeps the default order (newest month first, then student). */
  sort: z.enum(REPORT_SORT_KEYS).optional().catch(undefined),
  /** Sort direction for `sort`; defaults to ascending. */
  dir: z.enum(["asc", "desc"]).optional().catch(undefined),
});

export type PaymentsReportFilters = z.infer<typeof paymentsReportFiltersSchema>;

/**
 * Parses raw search params into filters.
 *
 * @param params - Query params (empty strings are treated as "not set").
 * @returns Validated filters; invalid entries are omitted.
 */
export function parsePaymentsReportFilters(
  params: Readonly<Record<string, string | undefined>>,
): PaymentsReportFilters {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
  );
  return paymentsReportFiltersSchema.parse(clean);
}

export type PaymentsReportRow = {
  /** Stable identity for the row: the payment id, or `${enrollmentId}:unpaid`. Used for React keys and de-duplication. */
  readonly id: string;
  /** Used to count distinct students: one student can have several rows (several months or enrollments). */
  readonly studentId: string;
  readonly studentName: string;
  readonly studentIdNumber: number | null;
  readonly courseId: string;
  readonly courseName: string;
  readonly levelId: string;
  readonly levelName: string;
  /** `YYYY-MM`, or `null` for an enrollment that has no payment yet. */
  readonly month: string | null;
  readonly method: PaymentMethod | null;
  readonly status: ReportStatus;
  /** The course price. Payments store no amount of their own, so this is the amount due for the row. */
  readonly amount: number;
  readonly notes: string | null;
  /** When the payment became paid; `null` unless the row is `APPROVED`. */
  readonly paidAt: Date | null;
};

export type ReportBucket = {
  readonly key: string;
  readonly label: string;
  readonly count: number;
  readonly amount: number;
};

export type PaymentsReport = {
  readonly rows: readonly PaymentsReportRow[];
  /** `count` is rows (payments); `students` is distinct students among them, which is what the courses page counts. */
  readonly total: { readonly count: number; readonly students: number; readonly amount: number };
  readonly byStatus: readonly ReportBucket[];
  readonly byMethod: readonly ReportBucket[];
  readonly byCourse: readonly ReportBucket[];
  readonly byLevel: readonly ReportBucket[];
};

/** Every status/method the report can show, in the order the filter dropdown and the breakdown use. */
const STATUS_DOMAIN: readonly ReportStatus[] = ["APPROVED", "PENDING", "UNPAID"];
const METHOD_DOMAIN: readonly (PaymentMethod | "NONE")[] = ["ONLINE", "CASH", "NONE"];

/** `Date` (a UTC first-of-month) → `YYYY-MM`. */
function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

const PAID_AT_FORMAT = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Africa/Cairo",
});

/**
 * Formats a paid-at time as `YYYY-MM-DD HH:mm` in Cairo time (same zone as the rest of the app), shared by the
 * table and the CSV so both show the same value.
 *
 * @param date - Paid-at time, or `null` for a row that isn't paid.
 * @returns The formatted time, or `null`.
 */
export function formatPaidAt(date: Date | null): string | null {
  return date === null ? null : PAID_AT_FORMAT.format(date);
}

/** Sort value of a row for each sortable column. `null` always sorts last, whatever the direction. */
const SORT_VALUE: Record<ReportSortKey, (r: PaymentsReportRow) => string | number | null> = {
  student: (r) => r.studentName,
  code: (r) => r.studentIdNumber,
  course: (r) => r.courseName,
  level: (r) => r.levelName,
  month: (r) => r.month,
  method: (r) => r.method,
  status: (r) => r.status,
  amount: (r) => r.amount,
  paidAt: (r) => r.paidAt?.getTime() ?? null,
};

/**
 * Compares two rows on a column, then by student name so ties keep a stable order.
 *
 * @param key - Column to sort by.
 * @param dir - Direction; affects non-null values only.
 * @returns A negative number, zero or a positive number, as `Array.prototype.sort` expects.
 */
function compareBy(key: ReportSortKey, dir: "asc" | "desc") {
  return (a: PaymentsReportRow, b: PaymentsReportRow): number => {
    const va = SORT_VALUE[key](a);
    const vb = SORT_VALUE[key](b);
    let c = 0;
    if (va === null || vb === null) c = va === vb ? 0 : va === null ? 1 : -1;
    else
      c =
        (typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb))) * (dir === "desc" ? -1 : 1);
    return c || a.studentName.localeCompare(b.studentName);
  };
}

/** This month, as `YYYY-MM` — the report's default `from`/`to` before the filter form is ever submitted. */
export function currentMonthKey(): string {
  return monthKey(new Date());
}

/**
 * Sums rows into buckets keyed by `keyOf`. Every entry in `domain` is present in the result — with
 * count/amount 0 if no row matched it — so a narrow filter never makes a whole type (a status, a method, a
 * course…) disappear from the breakdown; it only zeroes it out. Order follows `domain`, not amount, so the
 * breakdown doesn't reshuffle as filters change.
 */
function bucketize(
  rows: readonly PaymentsReportRow[],
  domain: readonly { key: string; label: string }[],
  keyOf: (row: PaymentsReportRow) => string,
): ReportBucket[] {
  const map = new Map<string, { label: string; count: number; amount: number }>();
  for (const { key, label } of domain) {
    map.set(key, { label, count: 0, amount: 0 });
  }
  for (const row of rows) {
    const key = keyOf(row);
    const bucket = map.get(key) ?? { label: key, count: 0, amount: 0 };
    bucket.count += 1;
    bucket.amount += row.amount;
    map.set(key, bucket);
  }
  return [...map.entries()].map(([key, b]) => ({ key, ...b }));
}

/** Distinct `{ key, label }` pairs, first occurrence wins, sorted by label. Used to build a breakdown's domain. */
function uniqueSorted<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  labelOf: (item: T) => string,
): { key: string; label: string }[] {
  const map = new Map<string, string>();
  for (const item of items) {
    const key = keyOf(item);
    if (!map.has(key)) map.set(key, labelOf(item));
  }
  return [...map.entries()]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** One row per payment record, plus one `UNPAID` row for an enrollment with no payment at all. */
function toRows(summaries: readonly EnrollmentPaymentSummary[]): PaymentsReportRow[] {
  return summaries.flatMap((s): PaymentsReportRow[] => {
    const base = {
      studentId: s.studentId,
      studentName: s.studentName,
      studentIdNumber: s.studentIdNumber,
      courseId: s.courseId,
      courseName: s.courseName,
      levelId: s.levelId,
      levelName: s.levelName,
      amount: s.coursePrice ?? 0,
    };
    if (s.allPayments.length === 0) {
      return [
        {
          ...base,
          id: `${s.enrollmentId}:unpaid`,
          month: null,
          method: null,
          status: "UNPAID",
          notes: null,
          paidAt: null,
        },
      ];
    }
    return s.allPayments.map((p) => ({
      ...base,
      id: p.id,
      month: monthKey(p.month),
      method: p.method,
      status: p.status,
      notes: p.notes,
      paidAt: p.status === "APPROVED" ? p.updatedAt : null,
    }));
  });
}

/**
 * Builds the payments report from a teacher's enrollment summaries.
 *
 * One row per payment record, plus one `UNPAID` row per enrollment with no payment at all. Unpaid rows have no
 * month, so they are dropped whenever a `from`/`to` range is set.
 *
 * @param summaries - Output of `PaymentRepository.findEnrollmentSummariesForTeacher`.
 * @param filters - Validated filters (see {@link parsePaymentsReportFilters}).
 * @returns Filtered, sorted rows and totals overall and by status, method, course and level.
 */
export function buildPaymentsReport(
  summaries: readonly EnrollmentPaymentSummary[],
  filters: PaymentsReportFilters,
): PaymentsReport {
  // De-duplicated by row id: a payment can only ever produce one row (its id), and an enrollment with no
  // payment produces exactly one `:unpaid` row, so this also guards against a future repository bug that
  // returns the same payment/enrollment twice (e.g. an accidental join fan-out).
  const seen = new Set<string>();
  const all = toRows(summaries).filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));

  const q = filters.q?.toLowerCase();
  const rows = all
    .filter((r) => !filters.status || r.status === filters.status)
    .filter((r) => !filters.method || r.method === filters.method)
    .filter((r) => !filters.courseId || r.courseId === filters.courseId)
    .filter((r) => !filters.levelId || r.levelId === filters.levelId)
    .filter((r) => {
      if (!filters.from && !filters.to) return true;
      if (r.month === null) return false;
      return (!filters.from || r.month >= filters.from) && (!filters.to || r.month <= filters.to);
    })
    .filter(
      (r) =>
        !q ||
        [r.studentName, String(r.studentIdNumber ?? ""), r.courseName, r.levelName, r.notes ?? ""]
          .join("\n")
          .toLowerCase()
          .includes(q),
    )
    // Default: newest month first, unpaid (no month) last, then by student for a stable order.
    .sort(
      filters.sort
        ? compareBy(filters.sort, filters.dir ?? "asc")
        : (a, b) =>
            (b.month ?? "").localeCompare(a.month ?? "") ||
            a.studentName.localeCompare(b.studentName),
    );

  // Breakdown domains come from ALL summaries (not just the filtered rows), so every status/method/course/level
  // the teacher has still shows up — at 0 — instead of vanishing when a filter narrows the result to nothing of
  // that type.
  const courseDomain = uniqueSorted(
    summaries,
    (s) => s.courseId,
    (s) => s.courseName,
  );
  const levelDomain = uniqueSorted(
    summaries,
    (s) => s.levelId,
    (s) => s.levelName,
  );

  return {
    rows,
    total: {
      count: rows.length,
      students: new Set(rows.map((r) => r.studentId)).size,
      amount: rows.reduce((sum, r) => sum + r.amount, 0),
    },
    byStatus: bucketize(
      rows,
      STATUS_DOMAIN.map((s) => ({ key: s, label: s })),
      (r) => r.status,
    ),
    byMethod: bucketize(
      rows,
      METHOD_DOMAIN.map((m) => ({ key: m, label: m })),
      (r) => r.method ?? "NONE",
    ),
    byCourse: bucketize(rows, courseDomain, (r) => r.courseId),
    byLevel: bucketize(rows, levelDomain, (r) => r.levelId),
  };
}

/** Localised strings the CSV needs; supplied by the caller so this module stays i18n-free. */
export type PaymentsReportCsvLabels = {
  /** One heading per entry of {@link REPORT_SORT_KEYS}, same order. */
  readonly columns: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  readonly status: Readonly<Record<ReportStatus, string>>;
  readonly method: Readonly<Record<PaymentMethod | "NONE", string>>;
  readonly total: string;
  /** Unit after the distinct-student count, e.g. "students". */
  readonly students: string;
  readonly byStatus: string;
  readonly byMethod: string;
  readonly byCourse: string;
  readonly byLevel: string;
};

/**
 * Quotes one CSV field. Values starting with `= + - @` (or tab/CR) get a leading `'` so a student named
 * `=HYPERLINK(...)` cannot execute as a formula when the file is opened in Excel/Sheets.
 */
function csvField(value: string | number | null): string {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Serialises a report to CSV: the rows, then the grand total and each breakdown.
 * The caller should prepend a UTF-8 BOM so Excel reads Arabic correctly.
 *
 * @param report - Result of {@link buildPaymentsReport}.
 * @param labels - Localised headings and enum labels.
 * @returns CSV text with `\r\n` line endings.
 */
export function paymentsReportToCsv(
  report: PaymentsReport,
  labels: PaymentsReportCsvLabels,
): string {
  const line = (cells: readonly (string | number | null)[]) => cells.map(csvField).join(",");
  const lines: string[] = [line(labels.columns)];

  for (const r of report.rows) {
    lines.push(
      line([
        r.studentName,
        r.studentIdNumber,
        r.courseName,
        r.levelName,
        r.month,
        labels.method[r.method ?? "NONE"],
        labels.status[r.status],
        r.amount,
        formatPaidAt(r.paidAt),
      ]),
    );
  }

  const section = (
    title: string,
    buckets: readonly ReportBucket[],
    name: (b: ReportBucket) => string,
  ) => {
    lines.push("", line([title]));
    for (const b of buckets) lines.push(line([name(b), b.count, b.amount]));
  };

  lines.push("", line([labels.total, report.total.count, report.total.amount]));
  lines.push(line([labels.students, report.total.students]));
  section(labels.byStatus, report.byStatus, (b) => labels.status[b.key as ReportStatus]);
  section(labels.byMethod, report.byMethod, (b) => labels.method[b.key as PaymentMethod | "NONE"]);
  section(labels.byCourse, report.byCourse, (b) => b.label);
  section(labels.byLevel, report.byLevel, (b) => b.label);

  return lines.join("\r\n");
}
