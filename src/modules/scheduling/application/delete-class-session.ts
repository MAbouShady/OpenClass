import { err, ok, type Result } from "@/shared/domain/result";
import { ClassSessionNotFoundError } from "@/modules/scheduling/domain/errors";
import type { ClassSessionRepository } from "@/modules/scheduling/domain/class-session-repository";
import {
  deleteClassSessionSchema,
  type DeleteClassSessionSchemaInput,
} from "@/modules/scheduling/application/class-session.schema";

export type DeleteClassSessionDeps = {
  readonly classSessionRepository: ClassSessionRepository;
};

export async function deleteClassSession(
  deps: DeleteClassSessionDeps,
  input: DeleteClassSessionSchemaInput,
): Promise<Result<void, ClassSessionNotFoundError>> {
  const { id } = deleteClassSessionSchema.parse(input);

  const existing = await deps.classSessionRepository.findById(id);
  if (!existing) {
    return err(new ClassSessionNotFoundError(id));
  }

  await deps.classSessionRepository.delete(id);
  return ok(undefined);
}
