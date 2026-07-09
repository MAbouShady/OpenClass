import type { ParentLink } from "@/modules/family/domain/parent-link";
import type {
  CreateParentLinkInput,
  ParentLinkRepository,
} from "@/modules/family/domain/parent-link-repository";

export class FakeParentLinkRepository implements ParentLinkRepository {
  private links: ParentLink[];
  private nextId = 1;

  constructor(seed: ParentLink[] = []) {
    this.links = seed;
  }

  async findByParentAndStudent(parentId: string, studentId: string): Promise<ParentLink | null> {
    return (
      this.links.find((link) => link.parentId === parentId && link.studentId === studentId) ?? null
    );
  }

  async findByParent(parentId: string): Promise<ParentLink[]> {
    return this.links.filter((link) => link.parentId === parentId);
  }

  async findAll(): Promise<ParentLink[]> {
    return this.links;
  }

  async create(input: CreateParentLinkInput): Promise<ParentLink> {
    const link: ParentLink = { id: `link-${this.nextId++}`, ...input };
    this.links.push(link);
    return link;
  }

  async delete(id: string): Promise<void> {
    this.links = this.links.filter((link) => link.id !== id);
  }
}
