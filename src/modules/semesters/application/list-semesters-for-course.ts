import type { Semester } from "@/modules/semesters/domain/semester";
import type { SemesterRepository } from "@/modules/semesters/domain/semester-repository";

export type ListSemestersForCourseDeps = {
  readonly semesterRepository: SemesterRepository;
};

export function listSemestersForCourse(
  deps: ListSemestersForCourseDeps,
  courseId: string,
): Promise<Semester[]> {
  return deps.semesterRepository.findByCourse(courseId);
}
