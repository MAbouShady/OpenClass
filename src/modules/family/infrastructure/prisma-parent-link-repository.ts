import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  CreateParentLinkInput,
  ParentLinkRepository,
} from "@/modules/family/domain/parent-link-repository";
import type { ParentLink } from "@/modules/family/domain/parent-link";

export class PrismaParentLinkRepository implements ParentLinkRepository {
  async findByParentAndStudent(parentId: string, studentId: string): Promise<ParentLink | null> {
    return prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
    });
  }

  async findByParent(parentId: string): Promise<ParentLink[]> {
    return prisma.parentStudent.findMany({ where: { parentId } });
  }

  async findAll(): Promise<ParentLink[]> {
    return prisma.parentStudent.findMany();
  }

  async create(input: CreateParentLinkInput): Promise<ParentLink> {
    return prisma.parentStudent.create({ data: input });
  }

  async delete(id: string): Promise<void> {
    await prisma.parentStudent.delete({ where: { id } });
  }
}
