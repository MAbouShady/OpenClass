import { err, ok, type Result } from "@/shared/domain/result";
import {
  AlreadyEnrolledError,
  EnrollmentSemesterNotFoundError,
} from "@/modules/enrollments/domain/errors";
import type { Enrollment } from "@/modules/enrollments/domain/enrollment";
import type { EnrollmentRepository } from "@/modules/enrollments/domain/enrollment-repository";
import type { SemesterRepository } from "@/modules/semesters/domain/semester-repository";
import {
  enrollStudentSchema,
  type EnrollStudentSchemaInput,
} from "@/modules/enrollments/application/enroll-student.schema";

export type EnrollStudentDeps = {
  readonly enrollmentRepository: EnrollmentRepository;
  readonly semesterRepository: SemesterRepository;
};

export async function enrollStudent(
  deps: EnrollStudentDeps,
  input: EnrollStudentSchemaInput,
): Promise<Result<Enrollment, EnrollmentSemesterNotFoundError | AlreadyEnrolledError>> {
  const { studentId, semesterId } = enrollStudentSchema.parse(input);

  const semester = await deps.semesterRepository.findById(semesterId);
  if (!semester) {
    return err(new EnrollmentSemesterNotFoundError(semesterId));
  }

  const existing = await deps.enrollmentRepository.findByStudentAndSemester(studentId, semesterId);
  if (existing) {
    return err(new AlreadyEnrolledError());
  }

  const enrollment = await deps.enrollmentRepository.create({ studentId, semesterId });
  return ok(enrollment);
}
