import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  CreatePaymentInput,
  EnrollmentPaymentSummary,
  PaymentRepository,
  PaymentRow,
  PaymentWithContext,
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

  async findAllForTeacher(teacherId: string): Promise<PaymentWithContext[]> {
    const enrollments = await prisma.enrollment.findMany({
      where: { semester: { course: { teacherId } } },
      include: {
        student: { select: { name: true, idNumber: true } },
        semester: { include: { course: { select: { title: true, price: true } } } },
        payments: { orderBy: { month: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result: PaymentWithContext[] = [];
    for (const enrollment of enrollments) {
      if (enrollment.payments.length === 0) {
        result.push({
          id: null,
          enrollmentId: enrollment.id,
          month: null,
          method: null,
          status: "UNPAID",
          proofUrl: null,
          notes: null,
          studentName: enrollment.student.name,
          studentIdNumber: enrollment.student.idNumber,
          courseName: enrollment.semester.course.title,
          coursePrice: enrollment.semester.course.price,
        });
      } else {
        for (const payment of enrollment.payments) {
          result.push({
            id: payment.id,
            enrollmentId: enrollment.id,
            month: payment.month,
            method: payment.method,
            status: payment.status,
            proofUrl: payment.proofUrl,
            notes: payment.notes,
            studentName: enrollment.student.name,
            studentIdNumber: enrollment.student.idNumber,
            courseName: enrollment.semester.course.title,
            coursePrice: enrollment.semester.course.price,
          });
        }
      }
    }
    return result;
  }

  async findEnrollmentSummariesForTeacher(teacherId: string): Promise<EnrollmentPaymentSummary[]> {
    const enrollments = await prisma.enrollment.findMany({
      where: { semester: { course: { teacherId } } },
      include: {
        student: { select: { name: true, idNumber: true } },
        semester: { include: { course: { select: { id: true, title: true, price: true, paymentFrequency: true, levelId: true, level: { select: { name: true } } } } } },
        payments: { orderBy: { month: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return enrollments.map((enrollment) => {
      const payments: PaymentRow[] = enrollment.payments.map((p) => ({
        id: p.id,
        month: p.month,
        method: p.method,
        status: p.status,
        proofUrl: p.proofUrl,
        notes: p.notes,
      }));
      return {
        enrollmentId: enrollment.id,
        studentName: enrollment.student.name,
        studentIdNumber: enrollment.student.idNumber,
        courseId: enrollment.semester.course.id,
        courseName: enrollment.semester.course.title,
        coursePrice: enrollment.semester.course.price,
        paymentFrequency: enrollment.semester.course.paymentFrequency as "ONE_TIME" | "MONTHLY" | "PER_SEMESTER" | null,
        levelId: enrollment.semester.course.levelId,
        levelName: enrollment.semester.course.level.name,
        latestPayment: payments[0] ?? null,
        allPayments: payments,
      };
    });
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

  async delete(id: string): Promise<void> {
    await prisma.payment.delete({ where: { id } });
  }
}
