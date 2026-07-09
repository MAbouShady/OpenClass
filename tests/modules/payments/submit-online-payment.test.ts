import { describe, expect, it } from "vitest";
import { submitOnlinePayment } from "@/modules/payments/application/submit-online-payment";
import { PaymentAlreadyExistsError } from "@/modules/payments/domain/errors";
import { FakePaymentRepository } from "./fake-payment-repository";

describe("submitOnlinePayment", () => {
  it("creates a pending online payment", async () => {
    const paymentRepository = new FakePaymentRepository();

    const result = await submitOnlinePayment(
      { paymentRepository },
      {
        enrollmentId: "enrollment-1",
        month: new Date("2026-01-15"),
        proofUrl: "https://example.com/proof.png",
        notes: null,
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ method: "ONLINE", status: "PENDING" });
  });

  it("rejects a duplicate payment for the same month", async () => {
    const paymentRepository = new FakePaymentRepository([
      {
        id: "payment-1",
        enrollmentId: "enrollment-1",
        month: new Date(Date.UTC(2026, 0, 1)),
        method: "ONLINE",
        status: "PENDING",
        proofUrl: "https://example.com/old.png",
        approvedById: null,
        notes: null,
      },
    ]);

    const result = await submitOnlinePayment(
      { paymentRepository },
      {
        enrollmentId: "enrollment-1",
        month: new Date("2026-01-20"),
        proofUrl: "https://example.com/new.png",
        notes: null,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(PaymentAlreadyExistsError);
  });
});
