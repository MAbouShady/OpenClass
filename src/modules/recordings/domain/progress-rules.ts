export type ProgressInput = {
  /** Position the player reported, in seconds. */
  readonly positionSeconds: number;
  /** Seconds already credited to this user for this lesson. */
  readonly previousWatchedSeconds: number;
  /** Previous furthest position, used to credit forward playback only. */
  readonly previousPositionSeconds: number;
  /** Authoritative lesson duration from the processed asset. */
  readonly durationSeconds: number;
  /** Percentage at which a lesson counts as completed. */
  readonly completionThreshold: number;
  readonly alreadyCompleted: boolean;
};

export type ComputedProgress = {
  readonly watchedSeconds: number;
  readonly lastPositionSeconds: number;
  readonly progressPercent: number;
  readonly completed: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Derives progress on the server. The client only ever proposes a playback
 * position — it can never assert a percentage or a completion flag, and it
 * cannot credit itself more watch time than wall-clock forward playback allows.
 */
export function computeProgress(input: ProgressInput): ComputedProgress {
  const duration = Math.max(1, Math.floor(input.durationSeconds));
  const position = clamp(Math.floor(input.positionSeconds), 0, duration);
  const previousPosition = clamp(Math.floor(input.previousPositionSeconds), 0, duration);
  const previousWatched = clamp(Math.floor(input.previousWatchedSeconds), 0, duration);

  // Only forward movement earns watch credit; seeking backwards earns nothing
  // and seeking forward cannot be used to skip ahead to "completed".
  const advanced = Math.max(0, position - previousPosition);
  const watchedSeconds = clamp(previousWatched + advanced, 0, duration);

  const progressPercent = clamp(Math.round((watchedSeconds / duration) * 100), 0, 100);
  const completed = input.alreadyCompleted || progressPercent >= input.completionThreshold;

  return { watchedSeconds, lastPositionSeconds: position, progressPercent, completed };
}

export type CourseProgressSummary = {
  readonly totalLessons: number;
  readonly completedLessons: number;
  readonly percent: number;
};

/** Course-level progress is always recomputed from stored lesson rows. */
export function summarizeCourseProgress(
  lessons: readonly { readonly completed: boolean }[],
): CourseProgressSummary {
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((lesson) => lesson.completed).length;
  const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
  return { totalLessons, completedLessons, percent };
}
