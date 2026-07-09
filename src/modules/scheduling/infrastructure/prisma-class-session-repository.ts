import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  ClassSessionRepository,
  CreateClassSessionInput,
} from "@/modules/scheduling/domain/class-session-repository";
import type { ClassSession } from "@/modules/scheduling/domain/class-session";

export class PrismaClassSessionRepository implements ClassSessionRepository {
  async findById(id: string): Promise<ClassSession | null> {
    return prisma.classSession.findUnique({ where: { id } });
  }

  async findByCourse(courseId: string): Promise<ClassSession[]> {
    return prisma.classSession.findMany({ where: { courseId }, orderBy: { startTime: "asc" } });
  }

  async create(input: CreateClassSessionInput): Promise<ClassSession> {
    return prisma.classSession.create({ data: input });
  }

  async delete(id: string): Promise<void> {
    await prisma.classSession.delete({ where: { id } });
  }
}
