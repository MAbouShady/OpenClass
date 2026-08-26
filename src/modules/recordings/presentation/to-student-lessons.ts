import type { LessonWithProgress } from "@/modules/recordings/application/get-course-lessons";
import type { StudentLessonItem } from "@/modules/recordings/presentation/lesson-list";

/**
 * Projects lessons for the student UI. Deliberately narrow: storage keys,
 * processing errors and asset ids never reach the browser.
 */
export function toStudentLessons(lessons: readonly LessonWithProgress[]): StudentLessonItem[] {
  return lessons.map(({ video, progress }) => ({
    id: video.id,
    title: video.title,
    position: video.position,
    durationSeconds: video.asset?.durationSeconds ?? null,
    completed: progress?.completed ?? false,
    progressPercent: progress?.progressPercent ?? 0,
    ready: video.asset?.processingStatus === "READY",
  }));
}
