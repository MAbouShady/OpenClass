import { err, ok, type Result } from "@/shared/domain/result";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { RecordedVideoRepository } from "@/modules/recordings/domain/recorded-video-repository";
import type { CourseAccessChecker } from "@/modules/recordings/domain/course-access";
import type { VideoAsset } from "@/modules/recordings/domain/video-asset";
import { isPlayable } from "@/modules/recordings/domain/video-asset";
import {
  CourseNotStartedError,
  CoursePaymentRequiredError,
  PlaybackForbiddenError,
  RecordedVideoNotFoundError,
  VideoNotProcessedError,
} from "@/modules/recordings/domain/errors";
import { canManageCourse, type RecordingActor } from "@/modules/recordings/application/actor";

export type AuthorizePlaybackDeps = {
  readonly recordedVideoRepository: RecordedVideoRepository;
  readonly courseRepository: CourseRepository;
  readonly courseAccessChecker: CourseAccessChecker;
};

export type AuthorizedPlayback = {
  readonly recordedVideoId: string;
  readonly courseId: string;
  readonly asset: VideoAsset;
};

export type AuthorizePlaybackError =
  RecordedVideoNotFoundError | PlaybackForbiddenError | VideoNotProcessedError;

/**
 * The single gate in front of every byte of video.
 *
 * Checks, in order: the lesson exists, its course exists, the course is
 * available, the actor may see the course, the lesson is published (or the
 * actor manages the course), the student's access is live — enrolled, the
 * semester has started, and the period is paid for — and processing has
 * finished. Only then is a playback authorization worth issuing.
 *
 * `recordedVideoId` is looked up on its own and its course is derived from the
 * row — never from the request — so swapping the id in the URL cannot reach a
 * lesson in a course the caller has no access to.
 */
export async function authorizePlayback(
  deps: AuthorizePlaybackDeps,
  actor: RecordingActor,
  recordedVideoId: string,
  asOf: Date = new Date(),
): Promise<Result<AuthorizedPlayback, AuthorizePlaybackError>> {
  const video = await deps.recordedVideoRepository.findById(recordedVideoId);
  if (!video) {
    return err(new RecordedVideoNotFoundError(recordedVideoId));
  }

  const course = await deps.courseRepository.findById(video.courseId);
  if (!course) {
    return err(new RecordedVideoNotFoundError(recordedVideoId));
  }

  const isManager = canManageCourse(actor, course);

  if (!isManager) {
    if (!course.isActive) {
      return err(new PlaybackForbiddenError());
    }
    if (video.status !== "PUBLISHED") {
      return err(new PlaybackForbiddenError());
    }
    // Enrolment alone grants nothing: the semester must have started and the
    // current period must be paid for.
    const access = await deps.courseAccessChecker.checkCourseAccess(actor.userId, course.id, asOf);
    if (!access.granted) {
      if (access.reason === "NOT_STARTED") {
        return err(new CourseNotStartedError(access.startsAt));
      }
      if (access.reason === "PAYMENT_REQUIRED") {
        return err(new CoursePaymentRequiredError(access.owedMonth));
      }
      return err(new PlaybackForbiddenError());
    }
  }

  if (!isPlayable(video.asset)) {
    return err(new VideoNotProcessedError());
  }

  return ok({ recordedVideoId: video.id, courseId: course.id, asset: video.asset! });
}
