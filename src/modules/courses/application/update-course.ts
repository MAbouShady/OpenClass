import { err, ok, type Result } from "@/shared/domain/result";
import { CourseForbiddenError, CourseNotFoundError } from "@/modules/courses/domain/errors";
import type { Course } from "@/modules/courses/domain/course";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { CourseActor } from "@/modules/courses/application/actor";
import {
  updateCourseSchema,
  type UpdateCourseSchemaInput,
} from "@/modules/courses/application/course.schema";

export type UpdateCourseDeps = {
  readonly courseRepository: CourseRepository;
};

export async function updateCourse(
  deps: UpdateCourseDeps,
  actor: CourseActor,
  input: UpdateCourseSchemaInput,
): Promise<Result<Course, CourseNotFoundError | CourseForbiddenError>> {
  const { id, ...rest } = updateCourseSchema.parse(input);

  const existing = await deps.courseRepository.findById(id);
  if (!existing) {
    return err(new CourseNotFoundError(id));
  }

  if (!actor.isAdmin && existing.teacherId !== actor.userId) {
    return err(new CourseForbiddenError());
  }

  const course = await deps.courseRepository.update(id, rest);
  return ok(course);
}
