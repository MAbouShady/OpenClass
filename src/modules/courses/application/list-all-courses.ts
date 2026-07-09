import type { Course } from "@/modules/courses/domain/course";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";

export type ListAllCoursesDeps = {
  readonly courseRepository: CourseRepository;
};

export function listAllCourses(deps: ListAllCoursesDeps): Promise<Course[]> {
  return deps.courseRepository.findAll();
}
