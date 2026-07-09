import type { Enrollment } from "@/modules/enrollments/domain/enrollment";
import type { EnrollmentRepository } from "@/modules/enrollments/domain/enrollment-repository";

export type ListEnrollmentsForStudentDeps = {
  readonly enrollmentRepository: EnrollmentRepository;
};

export function listEnrollmentsForStudent(
  deps: ListEnrollmentsForStudentDeps,
  studentId: string,
): Promise<Enrollment[]> {
  return deps.enrollmentRepository.findByStudent(studentId);
}
