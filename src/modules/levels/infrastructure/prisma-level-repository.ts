import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  CreateLevelInput,
  LevelRepository,
  UpdateLevelInput,
} from "@/modules/levels/domain/level-repository";
import type { Level } from "@/modules/levels/domain/level";

export class PrismaLevelRepository implements LevelRepository {
  async findAll(): Promise<Level[]> {
    return prisma.level.findMany({ orderBy: { order: "asc" } });
  }

  async findById(id: string): Promise<Level | null> {
    return prisma.level.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<Level | null> {
    return prisma.level.findUnique({ where: { name } });
  }

  async create(input: CreateLevelInput): Promise<Level> {
    return prisma.level.create({ data: input });
  }

  async update(id: string, input: UpdateLevelInput): Promise<Level> {
    return prisma.level.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await prisma.level.delete({ where: { id } });
  }
}
