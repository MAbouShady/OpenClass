import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  CreateEnrollmentInput,
  EnrollmentRepository,
} from "@/modules/enrollments/domain/enrollment-repository";
import type { Enrollment } from "@/modules/enrollments/domain/enrollment";

export class PrismaEnrollmentRepository implements EnrollmentRepository {
  async findById(id: string): Promise<Enrollment | null> {
    return prisma.enrollment.findUnique({ where: { id } });
  }

  async findByStudentAndSemester(
    studentId: string,
    semesterId: string,
  ): Promise<Enrollment | null> {
    return prisma.enrollment.findUnique({
      where: { studentId_semesterId: { studentId, semesterId } },
    });
  }

  async findByStudent(studentId: string): Promise<Enrollment[]> {
    return prisma.enrollment.findMany({ where: { studentId } });
  }

  async findBySemester(semesterId: string): Promise<Enrollment[]> {
    return prisma.enrollment.findMany({ where: { semesterId } });
  }

  async create(input: CreateEnrollmentInput): Promise<Enrollment> {
    return prisma.enrollment.create({ data: input });
  }
}
