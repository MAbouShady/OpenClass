import type { LessonProgress } from "@/modules/recordings/domain/lesson-progress";

export type UpsertLessonProgressInput = {
  readonly userId: string;
  readonly recordedVideoId: string;
  readonly watchedSeconds: number;
  readonly lastPositionSeconds: number;
  readonly progressPercent: number;
  readonly completed: boolean;
  readonly completedAt: Date | null;
};

export interface LessonProgressRepository {
  find(userId: string, recordedVideoId: string): Promise<LessonProgress | null>;
  findForUserAndVideos(
    userId: string,
    recordedVideoIds: readonly string[],
  ): Promise<LessonProgress[]>;
  upsert(input: UpsertLessonProgressInput): Promise<LessonProgress>;
}
