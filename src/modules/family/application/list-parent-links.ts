import type { ParentLink } from "@/modules/family/domain/parent-link";
import type { ParentLinkRepository } from "@/modules/family/domain/parent-link-repository";

export type ListParentLinksDeps = {
  readonly parentLinkRepository: ParentLinkRepository;
};

export function listParentLinks(deps: ListParentLinksDeps): Promise<ParentLink[]> {
  return deps.parentLinkRepository.findAll();
}
