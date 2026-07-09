import { err, ok, type Result } from "@/shared/domain/result";
import { LevelNotFoundError } from "@/modules/levels/domain/errors";
import type { LevelRepository } from "@/modules/levels/domain/level-repository";
import {
  deleteLevelSchema,
  type DeleteLevelSchemaInput,
} from "@/modules/levels/application/level.schema";

export type DeleteLevelDeps = {
  readonly levelRepository: LevelRepository;
};

export async function deleteLevel(
  deps: DeleteLevelDeps,
  input: DeleteLevelSchemaInput,
): Promise<Result<void, LevelNotFoundError>> {
  const { id } = deleteLevelSchema.parse(input);

  const existing = await deps.levelRepository.findById(id);
  if (!existing) {
    return err(new LevelNotFoundError(id));
  }

  await deps.levelRepository.delete(id);
  return ok(undefined);
}
