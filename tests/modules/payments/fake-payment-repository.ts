import type { Payment } from "@/modules/payments/domain/payment";
import type {
  CreatePaymentInput,
  PaymentRepository,
} from "@/modules/payments/domain/payment-repository";

export class FakePaymentRepository implements PaymentRepository {
  private payments: Payment[];
  private nextId = 1;

  constructor(seed: Payment[] = []) {
    this.payments = seed;
  }

  async findById(id: string): Promise<Payment | null> {
    return this.payments.find((payment) => payment.id === id) ?? null;
  }

  async findByEnrollmentAndMonth(enrollmentId: string, month: Date): Promise<Payment | null> {
    return (
      this.payments.find(
        (payment) =>
          payment.enrollmentId === enrollmentId && payment.month.getTime() === month.getTime(),
      ) ?? null
    );
  }

  async findByEnrollment(enrollmentId: string): Promise<Payment[]> {
    return this.payments.filter((payment) => payment.enrollmentId === enrollmentId);
  }

  async create(input: CreatePaymentInput): Promise<Payment> {
    const payment: Payment = { id: `payment-${this.nextId++}`, ...input };
    this.payments.push(payment);
    return payment;
  }

  async approve(id: string, approvedById: string): Promise<Payment> {
    const index = this.payments.findIndex((payment) => payment.id === id);
    const existing = this.payments[index];
    if (index === -1 || !existing) throw new Error("not found");
    const updated: Payment = { ...existing, status: "APPROVED", approvedById };
    this.payments[index] = updated;
    return updated;
  }

  async findAllForTeacher(_teacherId: string): Promise<never[]> { return []; }
  async findEnrollmentSummariesForTeacher(_teacherId: string): Promise<never[]> { return []; }
  async delete(_id: string): Promise<void> { throw new Error("not implemented"); }
}
