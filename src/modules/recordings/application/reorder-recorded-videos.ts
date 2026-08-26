import { err, ok, type Result } from "@/shared/domain/result";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { RecordedVideoRepository } from "@/modules/recordings/domain/recorded-video-repository";
import {
  RecordedVideoCourseNotFoundError,
  RecordedVideoForbiddenError,
  RecordedVideoNotFoundError,
} from "@/modules/recordings/domain/errors";
import { canManageCourse, type RecordingActor } from "@/modules/recordings/application/actor";
import {
  reorderRecordedVideosSchema,
  type ReorderRecordedVideosSchemaInput,
} from "@/modules/recordings/application/recorded-video.schema";

export type ReorderRecordedVideosDeps = {
  readonly recordedVideoRepository: RecordedVideoRepository;
  readonly courseRepository: CourseRepository;
};

export type ReorderRecordedVideosError =
  RecordedVideoCourseNotFoundError | RecordedVideoForbiddenError | RecordedVideoNotFoundError;

/**
 * Persists a drag-and-drop order. The submitted list must be exactly the
 * course's own videos — no additions, no omissions — so a crafted payload can
 * neither reposition another course's lesson nor silently drop one.
 */
export async function reorderRecordedVideos(
  deps: ReorderRecordedVideosDeps,
  actor: RecordingActor,
  input: ReorderRecordedVideosSchemaInput,
): Promise<Result<void, ReorderRecordedVideosError>> {
  const { courseId, orderedIds } = reorderRecordedVideosSchema.parse(input);

  const course = await deps.courseRepository.findById(courseId);
  if (!course) {
    return err(new RecordedVideoCourseNotFoundError(courseId));
  }
  if (!canManageCourse(actor, course)) {
    return err(new RecordedVideoForbiddenError());
  }

  const existing = await deps.recordedVideoRepository.findByCourse(courseId);
  const existingIds = new Set(existing.map((video) => video.id));
  const submitted = new Set(orderedIds);

  if (submitted.size !== orderedIds.length || submitted.size !== existingIds.size) {
    return err(new RecordedVideoNotFoundError(orderedIds.join(",")));
  }
  for (const id of orderedIds) {
    if (!existingIds.has(id)) {
      return err(new RecordedVideoNotFoundError(id));
    }
  }

  await deps.recordedVideoRepository.applyOrder(courseId, orderedIds);
  return ok(undefined);
}
