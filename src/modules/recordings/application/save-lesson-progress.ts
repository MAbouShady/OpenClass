import { err, ok, type Result } from "@/shared/domain/result";
import { z } from "zod";
import type { LessonProgress } from "@/modules/recordings/domain/lesson-progress";
import type { LessonProgressRepository } from "@/modules/recordings/domain/lesson-progress-repository";
import { computeProgress } from "@/modules/recordings/domain/progress-rules";
import { saveLessonProgressSchema } from "@/modules/recordings/application/recorded-video.schema";
import {
  authorizePlayback,
  type AuthorizePlaybackDeps,
  type AuthorizePlaybackError,
} from "@/modules/recordings/application/authorize-playback";
import type { RecordingActor } from "@/modules/recordings/application/actor";

export type SaveLessonProgressDeps = AuthorizePlaybackDeps & {
  readonly lessonProgressRepository: LessonProgressRepository;
  readonly completionThreshold: number;
};

/**
 * The client sends a playback position and nothing else. Watched time,
 * percentage and completion are all derived here from the asset's real
 * duration, so `completed=true` cannot simply be asserted by the browser.
 */
export async function saveLessonProgress(
  deps: SaveLessonProgressDeps,
  actor: RecordingActor,
  input: z.input<typeof saveLessonProgressSchema>,
): Promise<Result<LessonProgress, AuthorizePlaybackError>> {
  const { recordedVideoId, positionSeconds } = saveLessonProgressSchema.parse(input);

  // Progress is only recorded for someone who is allowed to watch right now.
  const authorized = await authorizePlayback(deps, actor, recordedVideoId);
  if (!authorized.ok) {
    return err(authorized.error);
  }

  const previous = await deps.lessonProgressRepository.find(actor.userId, recordedVideoId);

  const computed = computeProgress({
    positionSeconds,
    previousWatchedSeconds: previous?.watchedSeconds ?? 0,
    previousPositionSeconds: previous?.lastPositionSeconds ?? 0,
    durationSeconds: authorized.value.asset.durationSeconds ?? 0,
    completionThreshold: deps.completionThreshold,
    alreadyCompleted: previous?.completed ?? false,
  });

  const saved = await deps.lessonProgressRepository.upsert({
    userId: actor.userId,
    recordedVideoId,
    watchedSeconds: computed.watchedSeconds,
    lastPositionSeconds: computed.lastPositionSeconds,
    progressPercent: computed.progressPercent,
    completed: computed.completed,
    completedAt: computed.completed ? (previous?.completedAt ?? new Date()) : null,
  });

  return ok(saved);
}
