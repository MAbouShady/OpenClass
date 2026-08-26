import { err, ok, type Result } from "@/shared/domain/result";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { RecordedVideo } from "@/modules/recordings/domain/recorded-video";
import type { RecordedVideoRepository } from "@/modules/recordings/domain/recorded-video-repository";
import type { VideoAssetRepository } from "@/modules/recordings/domain/video-asset-repository";
import {
  RecordedVideoCourseNotFoundError,
  RecordedVideoForbiddenError,
  VideoAssetNotFoundError,
} from "@/modules/recordings/domain/errors";
import { canManageCourse, type RecordingActor } from "@/modules/recordings/application/actor";
import {
  createRecordedVideoSchema,
  type CreateRecordedVideoSchemaInput,
} from "@/modules/recordings/application/recorded-video.schema";

export type CreateRecordedVideoDeps = {
  readonly recordedVideoRepository: RecordedVideoRepository;
  readonly courseRepository: CourseRepository;
  readonly videoAssetRepository: VideoAssetRepository;
};

export type CreateRecordedVideoError =
  RecordedVideoCourseNotFoundError | RecordedVideoForbiddenError | VideoAssetNotFoundError;

export async function createRecordedVideo(
  deps: CreateRecordedVideoDeps,
  actor: RecordingActor,
  input: CreateRecordedVideoSchemaInput,
): Promise<Result<RecordedVideo, CreateRecordedVideoError>> {
  const parsed = createRecordedVideoSchema.parse(input);

  const course = await deps.courseRepository.findById(parsed.courseId);
  if (!course) {
    return err(new RecordedVideoCourseNotFoundError(parsed.courseId));
  }
  if (!canManageCourse(actor, course)) {
    return err(new RecordedVideoForbiddenError());
  }

  if (parsed.videoAssetId) {
    const asset = await deps.videoAssetRepository.findById(parsed.videoAssetId);
    // An asset may only be attached by whoever uploaded it, so one teacher can
    // never graft another teacher's upload onto their own lesson.
    if (!asset || (actor.role !== "ADMIN" && asset.uploadedById !== actor.userId)) {
      return err(new VideoAssetNotFoundError(parsed.videoAssetId));
    }
  }

  const position = await deps.recordedVideoRepository.nextPosition(parsed.courseId);

  const created = await deps.recordedVideoRepository.create({
    courseId: parsed.courseId,
    title: parsed.title,
    description: parsed.description,
    videoAssetId: parsed.videoAssetId,
    position,
    status: parsed.status,
  });

  return ok(created);
}
