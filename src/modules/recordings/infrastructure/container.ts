import "server-only";
import { randomUUID } from "node:crypto";
import { env } from "@/shared/config/env";
import { RateLimiter } from "@/shared/lib/rate-limit";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { LocalMediaStorage } from "@/modules/recordings/infrastructure/local-media-storage";
import { FfmpegVideoProcessor } from "@/modules/recordings/infrastructure/ffmpeg-video-processor";
import { InProcessVideoQueue } from "@/modules/recordings/infrastructure/in-process-video-queue";
import { PrismaCourseAccessChecker } from "@/modules/recordings/infrastructure/prisma-course-access-checker";
import { PrismaLessonProgressRepository } from "@/modules/recordings/infrastructure/prisma-lesson-progress-repository";
import { PrismaRecordedVideoRepository } from "@/modules/recordings/infrastructure/prisma-recorded-video-repository";
import { PrismaStudentDirectory } from "@/modules/recordings/infrastructure/prisma-student-directory";
import { PrismaVideoAssetRepository } from "@/modules/recordings/infrastructure/prisma-video-asset-repository";

/**
 * Composition root for the recordings module.
 *
 * Only the background worker is held across hot reloads — it owns an in-flight
 * queue, and a second one would transcode the same asset twice. Everything else
 * is rebuilt on every reload, so editing this file can never leave a stale,
 * half-shaped container behind.
 */
type Container = {
  readonly courseRepository: PrismaCourseRepository;
  readonly recordedVideoRepository: PrismaRecordedVideoRepository;
  readonly videoAssetRepository: PrismaVideoAssetRepository;
  readonly lessonProgressRepository: PrismaLessonProgressRepository;
  readonly courseAccessChecker: PrismaCourseAccessChecker;
  readonly studentDirectory: PrismaStudentDirectory;
  readonly mediaStorage: LocalMediaStorage;
  readonly processingQueue: InProcessVideoQueue;
  readonly maxBytes: number;
  readonly completionThreshold: number;
  readonly newUploadId: () => string;
};

const globalForRecordings = globalThis as unknown as {
  videoProcessingQueue?: InProcessVideoQueue;
};

const mediaStorage = new LocalMediaStorage();
const videoAssetRepository = new PrismaVideoAssetRepository();

const processingQueue =
  globalForRecordings.videoProcessingQueue ??
  new InProcessVideoQueue({
    videoAssetRepository,
    videoProcessor: new FfmpegVideoProcessor(mediaStorage),
  });

if (env.NODE_ENV !== "production") {
  globalForRecordings.videoProcessingQueue = processingQueue;
}

export const recordings: Container = {
  courseRepository: new PrismaCourseRepository(),
  recordedVideoRepository: new PrismaRecordedVideoRepository(),
  videoAssetRepository,
  lessonProgressRepository: new PrismaLessonProgressRepository(),
  courseAccessChecker: new PrismaCourseAccessChecker(),
  studentDirectory: new PrismaStudentDirectory(),
  mediaStorage,
  processingQueue,
  maxBytes: env.MAX_VIDEO_UPLOAD_BYTES,
  completionThreshold: env.LESSON_COMPLETION_THRESHOLD,
  newUploadId: () => randomUUID(),
};

/** Playback authorization is the expensive, enumerable endpoint — cap it. */
export const playbackRateLimiter = new RateLimiter(60, 60_000);
/** Upload chunks are large; a generous but finite ceiling per admin. */
export const uploadRateLimiter = new RateLimiter(600, 60_000);
/** Progress pings arrive every ~15s per open lesson. */
export const progressRateLimiter = new RateLimiter(60, 60_000);
/**
 * Code-number sign-in is unauthenticated and guessable by construction, so it
 * gets the tightest budget of all: enough for a mistyped code, not enough to
 * walk the number space.
 */
export const studentCodeRateLimiter = new RateLimiter(8, 60_000);
