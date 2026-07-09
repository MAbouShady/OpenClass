import type { ParentLink } from "@/modules/family/domain/parent-link";
import type { ParentLinkRepository } from "@/modules/family/domain/parent-link-repository";

export type ListChildrenForParentDeps = {
  readonly parentLinkRepository: ParentLinkRepository;
};

export function listChildrenForParent(
  deps: ListChildrenForParentDeps,
  parentId: string,
): Promise<ParentLink[]> {
  return deps.parentLinkRepository.findByParent(parentId);
}
