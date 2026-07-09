import { ok, type Result } from "@/shared/domain/result";
import type { Course } from "@/modules/courses/domain/course";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import {
  createCourseSchema,
  type CreateCourseSchemaInput,
} from "@/modules/courses/application/course.schema";

export type CreateCourseDeps = {
  readonly courseRepository: CourseRepository;
};

export async function createCourse(
  deps: CreateCourseDeps,
  input: CreateCourseSchemaInput,
): Promise<Result<Course, never>> {
  const parsed = createCourseSchema.parse(input);
  const course = await deps.courseRepository.create(parsed);
  return ok(course);
}
