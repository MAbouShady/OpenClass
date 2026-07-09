import { err, ok, type Result } from "@/shared/domain/result";
import { InvalidSessionTimeRangeError } from "@/modules/scheduling/domain/errors";
import type { ClassSession } from "@/modules/scheduling/domain/class-session";
import type { ClassSessionRepository } from "@/modules/scheduling/domain/class-session-repository";
import {
  createClassSessionSchema,
  type CreateClassSessionSchemaInput,
} from "@/modules/scheduling/application/class-session.schema";

export type CreateClassSessionDeps = {
  readonly classSessionRepository: ClassSessionRepository;
};

export async function createClassSession(
  deps: CreateClassSessionDeps,
  input: CreateClassSessionSchemaInput,
): Promise<Result<ClassSession, InvalidSessionTimeRangeError>> {
  const parsed = createClassSessionSchema.parse(input);

  if (parsed.endTime <= parsed.startTime) {
    return err(new InvalidSessionTimeRangeError());
  }

  const session = await deps.classSessionRepository.create(parsed);
  return ok(session);
}
