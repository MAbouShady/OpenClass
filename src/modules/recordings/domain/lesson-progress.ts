export type LessonProgress = {
  readonly id: string;
  readonly userId: string;
  readonly recordedVideoId: string;
  readonly watchedSeconds: number;
  readonly lastPositionSeconds: number;
  readonly progressPercent: number;
  readonly completed: boolean;
  readonly completedAt: Date | null;
};
