import { describe, expect, it } from "vitest";
import {
  buildPaymentsReport,
  parsePaymentsReportFilters,
  paymentsReportToCsv,
} from "@/modules/payments/application/payments-report";
import type { EnrollmentPaymentSummary } from "@/modules/payments/domain/payment-repository";

const pay = (
  id: string,
  month: string,
  method: "CASH" | "ONLINE",
  status: "APPROVED" | "PENDING",
) =>
  ({
    id,
    month: new Date(`${month}-01T00:00:00Z`),
    method,
    status,
    proofUrl: null,
    notes: null,
  }) as const;

const summary = (over: Partial<EnrollmentPaymentSummary>): EnrollmentPaymentSummary => ({
  enrollmentId: "e",
  studentName: "Sara",
  studentIdNumber: 100001,
  courseId: "c1",
  courseName: "Math",
  coursePrice: 300,
  paymentFrequency: "MONTHLY",
  levelId: "l1",
  levelName: "Level 1",
  latestPayment: null,
  allPayments: [],
  ...over,
});

const data = [
  summary({
    enrollmentId: "e1",
    allPayments: [
      pay("p1", "2026-09", "CASH", "APPROVED"),
      pay("p2", "2026-10", "ONLINE", "PENDING"),
    ],
  }),
  summary({
    enrollmentId: "e2",
    studentName: "=cmd|x",
    courseId: "c2",
    courseName: "Physics",
    coursePrice: 500,
    levelId: "l2",
    levelName: "Level 2",
    allPayments: [pay("p3", "2026-09", "ONLINE", "APPROVED")],
  }),
  summary({ enrollmentId: "e3", studentName: "Omar", allPayments: [] }),
];

describe("buildPaymentsReport", () => {
  it("totals everything and includes unpaid enrollments", () => {
    const r = buildPaymentsReport(data, {});
    expect(r.total).toEqual({ count: 4, amount: 300 + 300 + 500 + 300 });
    expect(r.byStatus.find((b) => b.key === "UNPAID")?.amount).toBe(300);
  });

  it("filters by status, course, month range and keyword", () => {
    expect(buildPaymentsReport(data, { status: "APPROVED" }).total.count).toBe(2);
    expect(buildPaymentsReport(data, { courseId: "c2" }).total.amount).toBe(500);
    // A date range drops unpaid rows (they have no month).
    expect(buildPaymentsReport(data, { from: "2026-10" }).rows.map((x) => x.month)).toEqual([
      "2026-10",
    ]);
    expect(buildPaymentsReport(data, { q: "omar" }).rows).toHaveLength(1);
  });

  it("ignores invalid query params", () => {
    expect(parsePaymentsReportFilters({ status: "NOPE", from: "2026-13", q: "" })).toEqual({});
  });

  it("keeps every status/method/course/level in the breakdown even at zero, once a filter empties it", () => {
    const byStatus = buildPaymentsReport(data, { status: "APPROVED" }).byStatus;
    expect(byStatus.map((b) => b.key)).toEqual(["APPROVED", "PENDING", "UNPAID"]);
    expect(byStatus.find((b) => b.key === "PENDING")).toEqual({
      key: "PENDING",
      label: "PENDING",
      count: 0,
      amount: 0,
    });

    // Filtering to course c1 still lists c2 (Physics) — at zero — instead of dropping it from the breakdown.
    const byCourse = buildPaymentsReport(data, { courseId: "c1" }).byCourse;
    expect(byCourse.map((b) => b.key).sort()).toEqual(["c1", "c2"]);
    expect(byCourse.find((b) => b.key === "c2")).toEqual({
      key: "c2",
      label: "Physics",
      count: 0,
      amount: 0,
    });
  });

  it("de-duplicates rows by their stable id", () => {
    const duped = [data[0]!, { ...data[0]!, studentName: "Sara (repeat)" }];
    // Same enrollmentId → same payment ids → the repeat is dropped, not double-counted.
    expect(buildPaymentsReport(duped, {}).total.count).toBe(2);
  });
});

describe("paymentsReportToCsv", () => {
  it("neutralises formula cells and appends totals", () => {
    const labels = {
      columns: ["a", "b", "c", "d", "e", "f", "g", "h"],
      status: { APPROVED: "ok", PENDING: "wait", UNPAID: "no" },
      method: { ONLINE: "on", CASH: "cash", NONE: "-" },
      total: "TOTAL",
      byStatus: "S",
      byMethod: "M",
      byCourse: "C",
      byLevel: "L",
    } as const;
    const csv = paymentsReportToCsv(buildPaymentsReport(data, {}), labels);
    expect(csv).toContain("'=cmd|x");
    expect(csv).toContain("TOTAL,4,1400");
  });
});
