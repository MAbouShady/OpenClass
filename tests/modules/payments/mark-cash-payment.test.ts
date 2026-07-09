import { describe, expect, it } from "vitest";
import { markCashPayment } from "@/modules/payments/application/mark-cash-payment";
import { PaymentAlreadyExistsError } from "@/modules/payments/domain/errors";
import { FakePaymentRepository } from "./fake-payment-repository";

describe("markCashPayment", () => {
  it("creates an approved cash payment", async () => {
    const paymentRepository = new FakePaymentRepository();

    const result = await markCashPayment(
      { paymentRepository },
      {
        enrollmentId: "enrollment-1",
        month: new Date("2026-01-15"),
        approvedById: "teacher-1",
        notes: null,
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ method: "CASH", status: "APPROVED" });
  });

  it("rejects a duplicate payment for the same month", async () => {
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

    const result = await markCashPayment(
      { paymentRepository },
      {
        enrollmentId: "enrollment-1",
        month: new Date("2026-01-20"),
        approvedById: "teacher-1",
        notes: null,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(PaymentAlreadyExistsError);
  });
});
