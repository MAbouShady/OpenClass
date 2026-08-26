import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { Course } from "@/modules/courses/domain/course";
import type {
  RecordedVideoRepository,
  RecordedVideoWithAsset,
} from "@/modules/recordings/domain/recorded-video-repository";
import type { LessonProgressRepository } from "@/modules/recordings/domain/lesson-progress-repository";
import type { LessonProgress } from "@/modules/recordings/domain/lesson-progress";
import type { CourseAccessChecker } from "@/modules/recordings/domain/course-access";
import type { CourseAccess } from "@/modules/recordings/domain/course-access-rules";
import {
  summarizeCourseProgress,
  type CourseProgressSummary,
} from "@/modules/recordings/domain/progress-rules";
import { canManageCourse, type RecordingActor } from "@/modules/recordings/application/actor";

export type GetCourseLessonsDeps = {
  readonly recordedVideoRepository: RecordedVideoRepository;
  readonly courseRepository: CourseRepository;
  readonly lessonProgressRepository: LessonProgressRepository;
  readonly courseAccessChecker: CourseAccessChecker;
};

export type LessonWithProgress = {
  readonly video: RecordedVideoWithAsset;
  readonly progress: LessonProgress | null;
};

export type CourseLessons = {
  readonly course: Course;
  readonly lessons: readonly LessonWithProgress[];
  readonly summary: CourseProgressSummary;
  readonly canManage: boolean;
  /**
   * Whether this viewer may actually watch. Denied-but-enrolled students still
   * receive the lesson list so they can see what their payment unlocks — the
   * player is withheld, and `authorizePlayback` refuses independently.
   */
  readonly access: CourseAccess;
};

/**
 * Lesson list for a viewer, in stored `position` order. Returns null when the
 * viewer has no business seeing the course at all, so callers can 404 without
 * leaking whether the course exists.
 */
export async function getCourseLessons(
  deps: GetCourseLessonsDeps,
  actor: RecordingActor,
  courseId: string,
  asOf: Date = new Date(),
): Promise<CourseLessons | null> {
  const course = await deps.courseRepository.findById(courseId);
  if (!course) return null;

  const canManage = canManageCourse(actor, course);

  // Managers always see their own course; a student's access is judged by
  // enrolment, start date and payment together.
  let access: CourseAccess = { granted: true, enrollmentId: "", semesterId: "" };

  if (!canManage) {
    if (!course.isActive) return null;
    access = await deps.courseAccessChecker.checkCourseAccess(actor.userId, course.id, asOf);
    // Someone with no enrolment at all learns nothing about the course.
    if (!access.granted && access.reason === "NOT_ENROLLED") return null;
  }

  const videos = canManage
    ? await deps.recordedVideoRepository.findByCourse(courseId)
    : await deps.recordedVideoRepository.findPublishedByCourse(courseId);

  const progressRows = await deps.lessonProgressRepository.findForUserAndVideos(
    actor.userId,
    videos.map((video) => video.id),
  );
  const progressByVideoId = new Map(progressRows.map((row) => [row.recordedVideoId, row]));

  const lessons = videos.map((video) => ({
    video,
    progress: progressByVideoId.get(video.id) ?? null,
  }));

  return {
    course,
    lessons,
    summary: summarizeCourseProgress(
      lessons.map((lesson) => ({ completed: lesson.progress?.completed ?? false })),
    ),
    canManage,
    access,
  };
}
