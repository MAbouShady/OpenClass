import type { ParentLink } from "@/modules/family/domain/parent-link";

export type CreateParentLinkInput = {
  readonly parentId: string;
  readonly studentId: string;
};

export interface ParentLinkRepository {
  findByParentAndStudent(parentId: string, studentId: string): Promise<ParentLink | null>;
  findByParent(parentId: string): Promise<ParentLink[]>;
  findAll(): Promise<ParentLink[]>;
  create(input: CreateParentLinkInput): Promise<ParentLink>;
  delete(id: string): Promise<void>;
}
