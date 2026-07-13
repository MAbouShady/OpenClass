import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  CreateLevelInput,
  LevelRepository,
  UpdateLevelInput,
} from "@/modules/levels/domain/level-repository";
import type { Level } from "@/modules/levels/domain/level";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLevel(row: any): Level {
  return {
    id: row.id as string,
    name: row.name as string,
    order: row.order as number,
    description: (row.description as string | null) ?? null,
    parentLevelId: (row.parentLevelId as string | null | undefined) ?? null,
    teacherId: (row.teacherId as string | null | undefined) ?? null,
  };
}

export class PrismaLevelRepository implements LevelRepository {
  async findAll(): Promise<Level[]> {
    const rows = await prisma.level.findMany({ orderBy: { order: "asc" } });
    return rows.map(toLevel);
  }

  async findByTeacher(teacherId: string): Promise<Level[]> {
    const rows = await prisma.level.findMany({
      where: { teacherId },
      orderBy: { order: "asc" },
    });
    return rows.map(toLevel);
  }

  async findById(id: string): Promise<Level | null> {
    const row = await prisma.level.findUnique({ where: { id } });
    return row ? toLevel(row) : null;
  }

  async findByName(name: string, teacherId?: string | null): Promise<Level | null> {
    const row = await prisma.level.findFirst({
      where: { name, teacherId: teacherId ?? null },
    });
    return row ? toLevel(row) : null;
  }

  async create(input: CreateLevelInput): Promise<Level> {
    const row = await prisma.level.create({ data: input as never });
    return toLevel(row);
  }

  async update(id: string, input: UpdateLevelInput): Promise<Level> {
    const row = await prisma.level.update({ where: { id }, data: input });
    return toLevel(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.level.delete({ where: { id } });
  }
}
