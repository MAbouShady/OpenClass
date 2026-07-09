import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  CreateSemesterInput,
  SemesterRepository,
} from "@/modules/semesters/domain/semester-repository";
import type { Semester } from "@/modules/semesters/domain/semester";

export class PrismaSemesterRepository implements SemesterRepository {
  async findById(id: string): Promise<Semester | null> {
    return prisma.semester.findUnique({ where: { id } });
  }

  async findByCourse(courseId: string): Promise<Semester[]> {
    return prisma.semester.findMany({ where: { courseId }, orderBy: { startDate: "asc" } });
  }

  async create(input: CreateSemesterInput): Promise<Semester> {
    return prisma.semester.create({ data: input });
  }

  async delete(id: string): Promise<void> {
    await prisma.semester.delete({ where: { id } });
  }
}
