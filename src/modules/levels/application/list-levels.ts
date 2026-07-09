import type { Level } from "@/modules/levels/domain/level";
import type { LevelRepository } from "@/modules/levels/domain/level-repository";

export type ListLevelsDeps = {
  readonly levelRepository: LevelRepository;
};

export function listLevels(deps: ListLevelsDeps): Promise<Level[]> {
  return deps.levelRepository.findAll();
}
