import { err, ok, type Result } from "@/shared/domain/result";
import { z } from "zod";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { RecordedVideoRepository } from "@/modules/recordings/domain/recorded-video-repository";
import type { VideoAssetRepository } from "@/modules/recordings/domain/video-asset-repository";
import type { VideoProcessingQueue } from "@/modules/recordings/domain/video-processor";
import { canRetryProcessing } from "@/modules/recordings/domain/video-asset";
import {
  RecordedVideoForbiddenError,
  RecordedVideoNotFoundError,
  VideoAssetNotFoundError,
  VideoProcessingNotRetryableError,
} from "@/modules/recordings/domain/errors";
import { canManageCourse, type RecordingActor } from "@/modules/recordings/application/actor";
import { recordedVideoIdSchema } from "@/modules/recordings/application/recorded-video.schema";

export type RetryVideoProcessingDeps = {
  readonly recordedVideoRepository: RecordedVideoRepository;
  readonly videoAssetRepository: VideoAssetRepository;
  readonly courseRepository: CourseRepository;
  readonly processingQueue: VideoProcessingQueue;
};

export type RetryVideoProcessingError =
  | RecordedVideoNotFoundError
  | RecordedVideoForbiddenError
  | VideoAssetNotFoundError
  | VideoProcessingNotRetryableError;

export async function retryVideoProcessing(
  deps: RetryVideoProcessingDeps,
  actor: RecordingActor,
  input: z.input<typeof recordedVideoIdSchema>,
): Promise<Result<void, RetryVideoProcessingError>> {
  const { id } = recordedVideoIdSchema.parse(input);

  const video = await deps.recordedVideoRepository.findById(id);
  if (!video) {
    return err(new RecordedVideoNotFoundError(id));
  }

  const course = await deps.courseRepository.findById(video.courseId);
  if (!course || !canManageCourse(actor, course)) {
    return err(new RecordedVideoForbiddenError());
  }

  if (!video.videoAssetId || !video.asset) {
    return err(new VideoAssetNotFoundError(id));
  }
  if (!canRetryProcessing(video.asset)) {
    return err(new VideoProcessingNotRetryableError());
  }

  // Attempts reset on a manual retry: an admin asking again is a deliberate act,
  // not the automatic redelivery the attempt cap is there to bound.
  await deps.videoAssetRepository.update(video.videoAssetId, {
    processingStatus: "PENDING",
    processingError: null,
    processingStartedAt: null,
    attempts: 0,
  });
  deps.processingQueue.enqueue(video.videoAssetId);

  return ok(undefined);
}
