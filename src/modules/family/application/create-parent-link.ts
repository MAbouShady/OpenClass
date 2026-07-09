import { err, ok, type Result } from "@/shared/domain/result";
import {
  ParentLinkAlreadyExistsError,
  UserNotFoundError,
  WrongRoleError,
} from "@/modules/family/domain/errors";
import type { ParentLink } from "@/modules/family/domain/parent-link";
import type { ParentLinkRepository } from "@/modules/family/domain/parent-link-repository";
import type { UserRepository } from "@/modules/auth/domain/user-repository";
import {
  createParentLinkSchema,
  type CreateParentLinkSchemaInput,
} from "@/modules/family/application/create-parent-link.schema";

export type CreateParentLinkDeps = {
  readonly parentLinkRepository: ParentLinkRepository;
  readonly userRepository: UserRepository;
};

export async function createParentLink(
  deps: CreateParentLinkDeps,
  input: CreateParentLinkSchemaInput,
): Promise<Result<ParentLink, UserNotFoundError | WrongRoleError | ParentLinkAlreadyExistsError>> {
  const { parentEmail, studentEmail } = createParentLinkSchema.parse(input);

  const parent = await deps.userRepository.findByEmail(parentEmail);
  if (!parent) return err(new UserNotFoundError(parentEmail));
  if (parent.role !== "PARENT") {
    return err(new WrongRoleError(`"${parentEmail}" is not registered as a parent.`));
  }

  const student = await deps.userRepository.findByEmail(studentEmail);
  if (!student) return err(new UserNotFoundError(studentEmail));
  if (student.role !== "STUDENT") {
    return err(new WrongRoleError(`"${studentEmail}" is not registered as a student.`));
  }

  const existing = await deps.parentLinkRepository.findByParentAndStudent(parent.id, student.id);
  if (existing) return err(new ParentLinkAlreadyExistsError());

  const link = await deps.parentLinkRepository.create({
    parentId: parent.id,
    studentId: student.id,
  });
  return ok(link);
}
