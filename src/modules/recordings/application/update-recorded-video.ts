import { err, ok, type Result } from "@/shared/domain/result";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { RecordedVideo } from "@/modules/recordings/domain/recorded-video";
import type {
  RecordedVideoRepository,
  UpdateRecordedVideoInput,
} from "@/modules/recordings/domain/recorded-video-repository";
import type { VideoAssetRepository } from "@/modules/recordings/domain/video-asset-repository";
import type { MediaStorage } from "@/modules/recordings/domain/media-storage";
import { assetPrefixKey } from "@/modules/recordings/domain/storage-keys";
import {
  RecordedVideoCourseNotFoundError,
  RecordedVideoForbiddenError,
  RecordedVideoNotFoundError,
  VideoAssetNotFoundError,
} from "@/modules/recordings/domain/errors";
import { canManageCourse, type RecordingActor } from "@/modules/recordings/application/actor";
import {
  updateRecordedVideoSchema,
  type UpdateRecordedVideoSchemaInput,
} from "@/modules/recordings/application/recorded-video.schema";

export type UpdateRecordedVideoDeps = {
  readonly recordedVideoRepository: RecordedVideoRepository;
  readonly courseRepository: CourseRepository;
  readonly videoAssetRepository: VideoAssetRepository;
  readonly mediaStorage: MediaStorage;
};

export type UpdateRecordedVideoError =
  | RecordedVideoNotFoundError
  | RecordedVideoForbiddenError
  | RecordedVideoCourseNotFoundError
  | VideoAssetNotFoundError;

export async function updateRecordedVideo(
  deps: UpdateRecordedVideoDeps,
  actor: RecordingActor,
  input: UpdateRecordedVideoSchemaInput,
): Promise<Result<RecordedVideo, UpdateRecordedVideoError>> {
  const parsed = updateRecordedVideoSchema.parse(input);

  const existing = await deps.recordedVideoRepository.findById(parsed.id);
  if (!existing) {
    return err(new RecordedVideoNotFoundError(parsed.id));
  }

  const currentCourse = await deps.courseRepository.findById(existing.courseId);
  if (!currentCourse || !canManageCourse(actor, currentCourse)) {
    return err(new RecordedVideoForbiddenError());
  }

  const movingCourse = parsed.courseId !== existing.courseId;
  if (movingCourse) {
    const targetCourse = await deps.courseRepository.findById(parsed.courseId);
    if (!targetCourse) {
      return err(new RecordedVideoCourseNotFoundError(parsed.courseId));
    }
    // Moving requires rights on *both* sides, so a video can never be pushed
    // into a course the actor does not manage.
    if (!canManageCourse(actor, targetCourse)) {
      return err(new RecordedVideoForbiddenError());
    }
  }

  if (parsed.videoAssetId !== undefined && parsed.videoAssetId !== null) {
    const asset = await deps.videoAssetRepository.findById(parsed.videoAssetId);
    if (!asset || (actor.role !== "ADMIN" && asset.uploadedById !== actor.userId)) {
      return err(new VideoAssetNotFoundError(parsed.videoAssetId));
    }
  }

  const patch: UpdateRecordedVideoInput = {
    title: parsed.title,
    description: parsed.description,
    status: parsed.status,
    courseId: parsed.courseId,
    ...(parsed.videoAssetId !== undefined ? { videoAssetId: parsed.videoAssetId } : {}),
    // A moved video always lands at the end of its new course; an in-place edit
    // keeps whatever position the reorder UI last persisted.
    position: movingCourse
      ? await deps.recordedVideoRepository.nextPosition(parsed.courseId)
      : (parsed.position ?? existing.position),
  };

  const updated = await deps.recordedVideoRepository.update(parsed.id, patch);

  // Replacing the video detaches the old asset; drop its row and its files so a
  // re-upload does not leave the previous rendition orphaned in storage.
  const replacedAssetId = existing.videoAssetId;
  if (
    parsed.videoAssetId !== undefined &&
    replacedAssetId &&
    replacedAssetId !== parsed.videoAssetId
  ) {
    await deps.videoAssetRepository.delete(replacedAssetId);
    try {
      await deps.mediaStorage.deletePrefix(assetPrefixKey(replacedAssetId));
    } catch (error) {
      console.error(`[recordings] storage cleanup failed for asset ${replacedAssetId}`, error);
    }
  }

  if (movingCourse) {
    // Close the hole the video left behind so the old course stays 1..n.
    await deps.recordedVideoRepository.compactPositions(existing.courseId);
  }

  return ok(updated);
}
