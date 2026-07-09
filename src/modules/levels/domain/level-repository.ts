import type { Level } from "@/modules/levels/domain/level";

export type CreateLevelInput = {
  readonly name: string;
  readonly order: number;
  readonly description: string | null;
};

export type UpdateLevelInput = Partial<CreateLevelInput>;

export interface LevelRepository {
  findAll(): Promise<Level[]>;
  findById(id: string): Promise<Level | null>;
  findByName(name: string): Promise<Level | null>;
  create(input: CreateLevelInput): Promise<Level>;
  update(id: string, input: UpdateLevelInput): Promise<Level>;
  delete(id: string): Promise<void>;
}
