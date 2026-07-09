import { err, ok, type Result } from "@/shared/domain/result";
import { SemesterNotFoundError } from "@/modules/semesters/domain/errors";
import type { SemesterRepository } from "@/modules/semesters/domain/semester-repository";
import {
  deleteSemesterSchema,
  type DeleteSemesterSchemaInput,
} from "@/modules/semesters/application/semester.schema";

export type DeleteSemesterDeps = {
  readonly semesterRepository: SemesterRepository;
};

export async function deleteSemester(
  deps: DeleteSemesterDeps,
  input: DeleteSemesterSchemaInput,
): Promise<Result<void, SemesterNotFoundError>> {
  const { id } = deleteSemesterSchema.parse(input);

  const existing = await deps.semesterRepository.findById(id);
  if (!existing) {
    return err(new SemesterNotFoundError(id));
  }

  await deps.semesterRepository.delete(id);
  return ok(undefined);
}
