import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { Course } from "@/modules/courses/domain/course";
import type { RecordedVideoRepository } from "@/modules/recordings/domain/recorded-video-repository";
import type { LessonProgressRepository } from "@/modules/recordings/domain/lesson-progress-repository";
import type { CourseAccessChecker } from "@/modules/recordings/domain/course-access";
import type { CourseAccess } from "@/modules/recordings/domain/course-access-rules";
import {
  summarizeCourseProgress,
  type CourseProgressSummary,
} from "@/modules/recordings/domain/progress-rules";

export type ListStudentCoursesDeps = {
  readonly courseRepository: CourseRepository;
  readonly recordedVideoRepository: RecordedVideoRepository;
  readonly lessonProgressRepository: LessonProgressRepository;
  readonly courseAccessChecker: CourseAccessChecker;
};

export type StudentCourseSummary = {
  readonly course: Course;
  readonly lessonCount: number;
  readonly summary: CourseProgressSummary;
  /** Locked courses are still listed, with the reason, so the student knows what to do. */
  readonly access: CourseAccess;
};

/**
 * Courses this student is enrolled in that are still available and hold at
 * least one published lesson.
 *
 * Locked courses are included rather than hidden: a student who has not paid
 * this month, or whose course starts later, should see the course and the
 * reason instead of an empty portal. Watching is refused separately, by
 * `authorizePlayback`.
 */
export async function listStudentCourses(
  deps: ListStudentCoursesDeps,
  studentId: string,
  asOf: Date = new Date(),
): Promise<StudentCourseSummary[]> {
  const accessByCourseId = await deps.courseAccessChecker.listCourseAccess(studentId, asOf);

  const results = await Promise.all(
    [...accessByCourseId].map(async ([courseId, access]) => {
      const course = await deps.courseRepository.findById(courseId);
      if (!course || !course.isActive) return null;

      const lessons = await deps.recordedVideoRepository.findPublishedByCourse(courseId);
      if (lessons.length === 0) return null;

      const progressRows = await deps.lessonProgressRepository.findForUserAndVideos(
        studentId,
        lessons.map((lesson) => lesson.id),
      );
      const completedById = new Map(
        progressRows.map((row) => [row.recordedVideoId, row.completed]),
      );

      return {
        course,
        lessonCount: lessons.length,
        summary: summarizeCourseProgress(
          lessons.map((lesson) => ({ completed: completedById.get(lesson.id) ?? false })),
        ),
        access,
      };
    }),
  );

  return results.filter((entry): entry is StudentCourseSummary => entry !== null);
}
