import type { Level } from "@/modules/levels/domain/level";
import type {
  CreateLevelInput,
  LevelRepository,
  UpdateLevelInput,
} from "@/modules/levels/domain/level-repository";

export class FakeLevelRepository implements LevelRepository {
  private levels: Level[];
  private nextId = 1;

  constructor(seed: Level[] = []) {
    this.levels = seed;
  }

  async findAll(): Promise<Level[]> {
    return [...this.levels].sort((a, b) => a.order - b.order);
  }

  async findByTeacher(teacherId: string): Promise<Level[]> {
    return [...this.levels]
      .filter((l) => l.teacherId === teacherId)
      .sort((a, b) => a.order - b.order);
  }

  async findById(id: string): Promise<Level | null> {
    return this.levels.find((level) => level.id === id) ?? null;
  }

  async findByName(name: string, teacherId?: string | null): Promise<Level | null> {
    return this.levels.find((l) => l.name === name && l.teacherId === (teacherId ?? null)) ?? null;
  }

  async create(input: CreateLevelInput): Promise<Level> {
    const level: Level = {
      id: `level-${this.nextId++}`,
      name: input.name,
      order: input.order,
      description: input.description,
      parentLevelId: input.parentLevelId ?? null,
      teacherId: input.teacherId ?? null,
    };
    this.levels.push(level);
    return level;
  }

  async update(id: string, input: UpdateLevelInput): Promise<Level> {
    const index = this.levels.findIndex((level) => level.id === id);
    const existing = this.levels[index];
    if (index === -1 || !existing) throw new Error("not found");
    const updated: Level = { ...existing, ...input };
    this.levels[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.levels = this.levels.filter((level) => level.id !== id);
  }
}
