import { err, ok, type Result } from "@/shared/domain/result";
import { LevelNameTakenError } from "@/modules/levels/domain/errors";
import type { Level } from "@/modules/levels/domain/level";
import type { LevelRepository } from "@/modules/levels/domain/level-repository";
import {
  createLevelSchema,
  type CreateLevelSchemaInput,
} from "@/modules/levels/application/level.schema";

export type CreateLevelDeps = {
  readonly levelRepository: LevelRepository;
};

export async function createLevel(
  deps: CreateLevelDeps,
  input: CreateLevelSchemaInput,
): Promise<Result<Level, LevelNameTakenError>> {
  const { name, order, description, parentLevelId, teacherId } = createLevelSchema.parse(input);

  const existing = await deps.levelRepository.findByName(name, teacherId);
  if (existing) {
    return err(new LevelNameTakenError(name));
  }

  const level = await deps.levelRepository.create({ name, order, description, parentLevelId, teacherId });
  return ok(level);
}
