import { err, ok, type Result } from "@/shared/domain/result";
import { z } from "zod";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { RecordedVideo } from "@/modules/recordings/domain/recorded-video";
import type { RecordedVideoRepository } from "@/modules/recordings/domain/recorded-video-repository";
import {
  RecordedVideoForbiddenError,
  RecordedVideoNotFoundError,
} from "@/modules/recordings/domain/errors";
import { canManageCourse, type RecordingActor } from "@/modules/recordings/application/actor";
import { setRecordedVideoStatusSchema } from "@/modules/recordings/application/recorded-video.schema";

export type SetRecordedVideoStatusDeps = {
  readonly recordedVideoRepository: RecordedVideoRepository;
  readonly courseRepository: CourseRepository;
};

export async function setRecordedVideoStatus(
  deps: SetRecordedVideoStatusDeps,
  actor: RecordingActor,
  input: z.input<typeof setRecordedVideoStatusSchema>,
): Promise<Result<RecordedVideo, RecordedVideoNotFoundError | RecordedVideoForbiddenError>> {
  const { id, status } = setRecordedVideoStatusSchema.parse(input);

  const existing = await deps.recordedVideoRepository.findById(id);
  if (!existing) {
    return err(new RecordedVideoNotFoundError(id));
  }

  const course = await deps.courseRepository.findById(existing.courseId);
  if (!course || !canManageCourse(actor, course)) {
    return err(new RecordedVideoForbiddenError());
  }

  return ok(await deps.recordedVideoRepository.update(id, { status }));
}
