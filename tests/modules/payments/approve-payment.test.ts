import { describe, expect, it } from "vitest";
import { approvePayment } from "@/modules/payments/application/approve-payment";
import { PaymentNotFoundError } from "@/modules/payments/domain/errors";
import { FakePaymentRepository } from "./fake-payment-repository";

describe("approvePayment", () => {
  it("approves a pending payment", async () => {
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

    const result = await approvePayment(
      { paymentRepository },
      { id: "payment-1", approvedById: "teacher-1" },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ status: "APPROVED", approvedById: "teacher-1" });
  });

  it("rejects approving a payment that does not exist", async () => {
    const paymentRepository = new FakePaymentRepository();

    const result = await approvePayment(
      { paymentRepository },
      { id: "missing", approvedById: "teacher-1" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(PaymentNotFoundError);
  });
});
