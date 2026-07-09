import { describe, expect, it } from "vitest";
import { isEnrollmentBlocked } from "@/modules/payments/application/is-enrollment-blocked";
import { FakePaymentRepository } from "./fake-payment-repository";

describe("isEnrollmentBlocked", () => {
  it("is not blocked when the current month is paid", async () => {
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

    const blocked = await isEnrollmentBlocked(
      { paymentRepository },
      "enrollment-1",
      new Date("2026-01-20"),
    );

    expect(blocked).toBe(false);
  });

  it("is blocked when there is no payment for the current month", async () => {
    const paymentRepository = new FakePaymentRepository();

    const blocked = await isEnrollmentBlocked(
      { paymentRepository },
      "enrollment-1",
      new Date("2026-01-20"),
    );

    expect(blocked).toBe(true);
  });
});
