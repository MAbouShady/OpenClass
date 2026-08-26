import { err, ok, type Result } from "@/shared/domain/result";
import { z } from "zod";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { RecordedVideoRepository } from "@/modules/recordings/domain/recorded-video-repository";
import type { VideoAssetRepository } from "@/modules/recordings/domain/video-asset-repository";
import type { MediaStorage } from "@/modules/recordings/domain/media-storage";
import { assetPrefixKey } from "@/modules/recordings/domain/storage-keys";
import {
  RecordedVideoForbiddenError,
  RecordedVideoNotFoundError,
} from "@/modules/recordings/domain/errors";
import { canManageCourse, type RecordingActor } from "@/modules/recordings/application/actor";
import { recordedVideoIdSchema } from "@/modules/recordings/application/recorded-video.schema";

export type DeleteRecordedVideoDeps = {
  readonly recordedVideoRepository: RecordedVideoRepository;
  readonly videoAssetRepository: VideoAssetRepository;
  readonly courseRepository: CourseRepository;
  readonly mediaStorage: MediaStorage;
};

/**
 * Deletes the lesson, its asset row and every derived file.
 *
 * Database first, storage second: if the storage sweep fails we are left with
 * unreferenced bytes on disk (recoverable, invisible to users) rather than a
 * row pointing at a file that no longer exists.
 */
export async function deleteRecordedVideo(
  deps: DeleteRecordedVideoDeps,
  actor: RecordingActor,
  input: z.input<typeof recordedVideoIdSchema>,
): Promise<Result<void, RecordedVideoNotFoundError | RecordedVideoForbiddenError>> {
  const { id } = recordedVideoIdSchema.parse(input);

  const existing = await deps.recordedVideoRepository.findById(id);
  if (!existing) {
    return err(new RecordedVideoNotFoundError(id));
  }

  const course = await deps.courseRepository.findById(existing.courseId);
  if (!course || !canManageCourse(actor, course)) {
    return err(new RecordedVideoForbiddenError());
  }

  const assetId = existing.videoAssetId;

  await deps.recordedVideoRepository.delete(id);
  if (assetId) {
    await deps.videoAssetRepository.delete(assetId);
  }
  await deps.recordedVideoRepository.compactPositions(existing.courseId);

  if (assetId) {
    try {
      await deps.mediaStorage.deletePrefix(assetPrefixKey(assetId));
    } catch (error) {
      console.error(`[recordings] storage cleanup failed for asset ${assetId}`, error);
    }
  }

  return ok(undefined);
}
