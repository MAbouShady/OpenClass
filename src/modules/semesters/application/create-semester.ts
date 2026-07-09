import { err, ok, type Result } from "@/shared/domain/result";
import { InvalidSemesterDateRangeError } from "@/modules/semesters/domain/errors";
import type { Semester } from "@/modules/semesters/domain/semester";
import type { SemesterRepository } from "@/modules/semesters/domain/semester-repository";
import {
  createSemesterSchema,
  type CreateSemesterSchemaInput,
} from "@/modules/semesters/application/semester.schema";

export type CreateSemesterDeps = {
  readonly semesterRepository: SemesterRepository;
};

export async function createSemester(
  deps: CreateSemesterDeps,
  input: CreateSemesterSchemaInput,
): Promise<Result<Semester, InvalidSemesterDateRangeError>> {
  const parsed = createSemesterSchema.parse(input);

  if (parsed.endDate <= parsed.startDate) {
    return err(new InvalidSemesterDateRangeError());
  }

  const semester = await deps.semesterRepository.create(parsed);
  return ok(semester);
}
