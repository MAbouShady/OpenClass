import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  CreatePaymentInput,
  PaymentRepository,
} from "@/modules/payments/domain/payment-repository";
import type { Payment } from "@/modules/payments/domain/payment";

export class PrismaPaymentRepository implements PaymentRepository {
  async findById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { id } });
  }

  async findByEnrollmentAndMonth(enrollmentId: string, month: Date): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { enrollmentId_month: { enrollmentId, month } },
    });
  }

  async findByEnrollment(enrollmentId: string): Promise<Payment[]> {
    return prisma.payment.findMany({ where: { enrollmentId }, orderBy: { month: "desc" } });
  }

  async create(input: CreatePaymentInput): Promise<Payment> {
    return prisma.payment.create({ data: input });
  }

  async approve(id: string, approvedById: string): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data: { status: "APPROVED", approvedById },
    });
  }
}
