import { err, ok, type Result } from "@/shared/domain/result";
import { CourseForbiddenError, CourseNotFoundError } from "@/modules/courses/domain/errors";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { CourseActor } from "@/modules/courses/application/actor";
import {
  deleteCourseSchema,
  type DeleteCourseSchemaInput,
} from "@/modules/courses/application/course.schema";

export type DeleteCourseDeps = {
  readonly courseRepository: CourseRepository;
};

export async function deleteCourse(
  deps: DeleteCourseDeps,
  actor: CourseActor,
  input: DeleteCourseSchemaInput,
): Promise<Result<void, CourseNotFoundError | CourseForbiddenError>> {
  const { id } = deleteCourseSchema.parse(input);

  const existing = await deps.courseRepository.findById(id);
  if (!existing) {
    return err(new CourseNotFoundError(id));
  }

  if (!actor.isAdmin && existing.teacherId !== actor.userId) {
    return err(new CourseForbiddenError());
  }

  await deps.courseRepository.delete(id);
  return ok(undefined);
}
