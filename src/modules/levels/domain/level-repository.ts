import type { Level } from "@/modules/levels/domain/level";

export type CreateLevelInput = {
  readonly name: string;
  readonly order: number;
  readonly description: string | null;
  readonly parentLevelId?: string | null;
  readonly teacherId?: string | null;
};

export type UpdateLevelInput = Partial<Omit<CreateLevelInput, "parentLevelId" | "teacherId">>;

export interface LevelRepository {
  findAll(): Promise<Level[]>;
  findByTeacher(teacherId: string): Promise<Level[]>;
  findById(id: string): Promise<Level | null>;
  findByName(name: string, teacherId?: string | null): Promise<Level | null>;
  create(input: CreateLevelInput): Promise<Level>;
  update(id: string, input: UpdateLevelInput): Promise<Level>;
  delete(id: string): Promise<void>;
}
