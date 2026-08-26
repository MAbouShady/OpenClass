import { prisma } from "@/shared/infrastructure/prisma/client";
import type { LessonProgress } from "@/modules/recordings/domain/lesson-progress";
import type {
  LessonProgressRepository,
  UpsertLessonProgressInput,
} from "@/modules/recordings/domain/lesson-progress-repository";

type Row = LessonProgress & { createdAt: Date; updatedAt: Date };

function toLessonProgress(row: Row): LessonProgress {
  return {
    id: row.id,
    userId: row.userId,
    recordedVideoId: row.recordedVideoId,
    watchedSeconds: row.watchedSeconds,
    lastPositionSeconds: row.lastPositionSeconds,
    progressPercent: row.progressPercent,
    completed: row.completed,
    completedAt: row.completedAt,
  };
}

export class PrismaLessonProgressRepository implements LessonProgressRepository {
  async find(userId: string, recordedVideoId: string): Promise<LessonProgress | null> {
    const row = await prisma.lessonProgress.findUnique({
      where: { userId_recordedVideoId: { userId, recordedVideoId } },
    });
    return row ? toLessonProgress(row) : null;
  }

  async findForUserAndVideos(
    userId: string,
    recordedVideoIds: readonly string[],
  ): Promise<LessonProgress[]> {
    if (recordedVideoIds.length === 0) return [];
    const rows = await prisma.lessonProgress.findMany({
      where: { userId, recordedVideoId: { in: [...recordedVideoIds] } },
    });
    return rows.map(toLessonProgress);
  }

  async upsert(input: UpsertLessonProgressInput): Promise<LessonProgress> {
    const { userId, recordedVideoId, ...values } = input;
    const row = await prisma.lessonProgress.upsert({
      where: { userId_recordedVideoId: { userId, recordedVideoId } },
      create: { userId, recordedVideoId, ...values },
      update: values,
    });
    return toLessonProgress(row);
  }
}
