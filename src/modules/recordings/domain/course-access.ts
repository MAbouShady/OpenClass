import type { CourseAccess } from "@/modules/recordings/domain/course-access-rules";

/**
 * Port over the *existing* enrolment and payment systems. Recorded videos never
 * define their own access rules — they inherit whatever the course already
 * grants, including the monthly payment requirement.
 */
export interface CourseAccessChecker {
  /** Whether this student may watch the course right now, and why not if not. */
  checkCourseAccess(studentId: string, courseId: string, asOf: Date): Promise<CourseAccess>;
  /** Access state for every course the student is enrolled in, keyed by course id. */
  listCourseAccess(studentId: string, asOf: Date): Promise<Map<string, CourseAccess>>;
}
