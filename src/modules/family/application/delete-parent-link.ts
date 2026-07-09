import {
  deleteParentLinkSchema,
  type DeleteParentLinkSchemaInput,
} from "@/modules/family/application/create-parent-link.schema";
import type { ParentLinkRepository } from "@/modules/family/domain/parent-link-repository";

export type DeleteParentLinkDeps = {
  readonly parentLinkRepository: ParentLinkRepository;
};

export async function deleteParentLink(
  deps: DeleteParentLinkDeps,
  input: DeleteParentLinkSchemaInput,
): Promise<void> {
  const { id } = deleteParentLinkSchema.parse(input);
  await deps.parentLinkRepository.delete(id);
}
