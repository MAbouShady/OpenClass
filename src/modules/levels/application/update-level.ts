import { err, ok, type Result } from "@/shared/domain/result";
import { LevelNameTakenError, LevelNotFoundError } from "@/modules/levels/domain/errors";
import type { Level } from "@/modules/levels/domain/level";
import type { LevelRepository } from "@/modules/levels/domain/level-repository";
import {
  updateLevelSchema,
  type UpdateLevelSchemaInput,
} from "@/modules/levels/application/level.schema";

export type UpdateLevelDeps = {
  readonly levelRepository: LevelRepository;
};

export async function updateLevel(
  deps: UpdateLevelDeps,
  input: UpdateLevelSchemaInput,
): Promise<Result<Level, LevelNotFoundError | LevelNameTakenError>> {
  const { id, name, order, description } = updateLevelSchema.parse(input);

  const existing = await deps.levelRepository.findById(id);
  if (!existing) {
    return err(new LevelNotFoundError(id));
  }

  if (name !== existing.name) {
    const nameOwner = await deps.levelRepository.findByName(name);
    if (nameOwner && nameOwner.id !== id) {
      return err(new LevelNameTakenError(name));
    }
  }

  const level = await deps.levelRepository.update(id, { name, order, description });
  return ok(level);
}
