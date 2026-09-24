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
    updatedAt: new Date(`${month}-05T10:00:00Z`),
  }) as const;

const summary = (over: Partial<EnrollmentPaymentSummary>): EnrollmentPaymentSummary => ({
  enrollmentId: "e",
  studentId: "s1",
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
    studentId: "s2",
    studentName: "=cmd|x",
    courseId: "c2",
    courseName: "Physics",
    coursePrice: 500,
    levelId: "l2",
    levelName: "Level 2",
    allPayments: [pay("p3", "2026-09", "ONLINE", "APPROVED")],
  }),
  summary({ enrollmentId: "e3", studentId: "s3", studentName: "Omar", allPayments: [] }),
];

describe("buildPaymentsReport", () => {
  it("totals everything and includes unpaid enrollments", () => {
    const r = buildPaymentsReport(data, {});
    expect(r.total).toEqual({ count: 4, students: 3, amount: 300 + 300 + 500 + 300 });
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

  it("counts a student paid on two enrollments of one course once in `students`", () => {
    // The production case: same student, two semesters of the course, both marked paid for the same month.
    const twice = [
      summary({ enrollmentId: "a", allPayments: [pay("pa", "2026-09", "CASH", "APPROVED")] }),
      summary({ enrollmentId: "b", allPayments: [pay("pb", "2026-09", "CASH", "APPROVED")] }),
    ];
    expect(buildPaymentsReport(twice, {}).total).toMatchObject({ count: 2, students: 1 });
  });

  it("sets paidAt only on approved rows", () => {
    const rows = buildPaymentsReport(data, {}).rows;
    expect(rows.find((r) => r.id === "p1")?.paidAt).toEqual(new Date("2026-09-05T10:00:00Z"));
    expect(rows.find((r) => r.id === "p2")?.paidAt).toBeNull();
    expect(rows.find((r) => r.status === "UNPAID")?.paidAt).toBeNull();
  });

  it("sorts by any column, both directions, nulls last", () => {
    const ids = (f: Parameters<typeof buildPaymentsReport>[1]) =>
      buildPaymentsReport(data, f).rows.map((r) => r.id);
    expect(ids({ sort: "amount", dir: "desc" })[0]).toBe("p3");
    // p1/p3 share a paid-at time; the null ties (p2, unpaid) fall back to student name: Omar before Sara.
    expect(ids({ sort: "paidAt" })).toEqual(["p3", "p1", "e3:unpaid", "p2"]);
    expect(ids({ sort: "paidAt", dir: "desc" }).slice(-2).sort()).toEqual(["e3:unpaid", "p2"]);
    expect(ids({ sort: "student" })[0]).toBe("p3"); // "=cmd|x" sorts before letters
  });

  it("ignores invalid query params", () => {
    expect(
      parsePaymentsReportFilters({ status: "NOPE", from: "2026-13", q: "", sort: "x", dir: "up" }),
    ).toEqual({});
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
      columns: ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
      status: { APPROVED: "ok", PENDING: "wait", UNPAID: "no" },
      method: { ONLINE: "on", CASH: "cash", NONE: "-" },
      total: "TOTAL",
      students: "STUDENTS",
      byStatus: "S",
      byMethod: "M",
      byCourse: "C",
      byLevel: "L",
    } as const;
    const csv = paymentsReportToCsv(buildPaymentsReport(data, {}), labels);
    expect(csv).toContain("'=cmd|x");
    expect(csv).toContain("TOTAL,4,1400");
    expect(csv).toContain("STUDENTS,3");
    // Paid-at column, Cairo time (UTC+3 in September).
    expect(csv).toContain("2026-09-05 13:00");
  });
});
