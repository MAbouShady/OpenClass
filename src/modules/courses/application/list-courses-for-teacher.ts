import type { Course } from "@/modules/courses/domain/course";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";

export type ListCoursesForTeacherDeps = {
  readonly courseRepository: CourseRepository;
};

export function listCoursesForTeacher(
  deps: ListCoursesForTeacherDeps,
  teacherId: string,
): Promise<Course[]> {
  return deps.courseRepository.findByTeacher(teacherId);
}

export function listActiveCoursesForTeacher(
  deps: ListCoursesForTeacherDeps,
  teacherId: string,
): Promise<Course[]> {
  return deps.courseRepository.findActiveByTeacher(teacherId);
}
