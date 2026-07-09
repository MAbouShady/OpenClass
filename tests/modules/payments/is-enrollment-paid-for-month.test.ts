import { describe, expect, it } from "vitest";
import { isEnrollmentPaidForMonth } from "@/modules/payments/application/is-enrollment-paid-for-month";
import { FakePaymentRepository } from "./fake-payment-repository";

describe("isEnrollmentPaidForMonth", () => {
  it("returns true when an approved payment exists for the month", async () => {
    const paymentRepository = new FakePaymentRepository([
      {
        id: "payment-1",
        enrollmentId: "enrollment-1",
        month: new Date(Date.UTC(2026, 0, 1)),
        method: "CASH",
        status: "APPROVED",
        proofUrl: null,
        approvedById: "teacher-1",
        notes: null,
      },
    ]);

    const paid = await isEnrollmentPaidForMonth(
      { paymentRepository },
      "enrollment-1",
      new Date("2026-01-20"),
    );

    expect(paid).toBe(true);
  });

  it("returns false when payment is only pending", async () => {
    const paymentRepository = new FakePaymentRepository([
      {
        id: "payment-1",
        enrollmentId: "enrollment-1",
        month: new Date(Date.UTC(2026, 0, 1)),
        method: "ONLINE",
        status: "PENDING",
        proofUrl: "https://example.com/proof.png",
        approvedById: null,
        notes: null,
      },
    ]);

    const paid = await isEnrollmentPaidForMonth(
      { paymentRepository },
      "enrollment-1",
      new Date("2026-01-20"),
    );

    expect(paid).toBe(false);
  });

  it("returns false when there is no payment at all", async () => {
    const paymentRepository = new FakePaymentRepository();

    const paid = await isEnrollmentPaidForMonth(
      { paymentRepository },
      "enrollment-1",
      new Date("2026-01-20"),
    );

    expect(paid).toBe(false);
  });
});
