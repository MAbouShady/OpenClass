export type CourseStudentCounts = {
  /** Distinct students holding an enrolment in any semester of the course. */
  readonly enrolled: number;
  /** Of those, how many have paid for the period that is currently due. */
  readonly paid: number;
};

/** Read model for the per-course headline numbers a teacher scans for. */
export interface CourseStudentCountsReader {
  forTeacher(teacherId: string, asOf: Date): Promise<Map<string, CourseStudentCounts>>;
}
