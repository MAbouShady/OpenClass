import { prisma } from "@/shared/infrastructure/prisma/client";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import type { CourseAccessChecker } from "@/modules/recordings/domain/course-access";
import {
  decideCourseAccess,
  type CourseAccess,
  type EnrollmentAccessFacts,
} from "@/modules/recordings/domain/course-access-rules";

type EnrollmentRow = {
  id: string;
  semesterId: string;
  semester: {
    courseId: string;
    startDate: Date;
    course: { paymentFrequency: "ONE_TIME" | "MONTHLY" | "PER_SEMESTER" };
  };
  payments: { month: Date; status: "PENDING" | "APPROVED" }[];
};

const ENROLLMENT_SELECT = {
  id: true,
  semesterId: true,
  semester: {
    select: {
      courseId: true,
      startDate: true,
      course: { select: { paymentFrequency: true } },
    },
  },
  // Only APPROVED payments are read: a pending, unverified transfer must never
  // unlock a video.
  payments: {
    where: { status: "APPROVED" as const },
    select: { month: true, status: true },
  },
} as const;

function toFacts(row: EnrollmentRow): EnrollmentAccessFacts {
  return {
    enrollmentId: row.id,
    semesterId: row.semesterId,
    semesterStartDate: row.semester.startDate,
    paymentFrequency: row.semester.course.paymentFrequency,
    approvedMonths: row.payments.map((payment) => normalizeToMonthStart(payment.month)),
  };
}

/**
 * Reads access straight off the existing enrolment, semester and payment
 * tables: Enrollment → Semester → Course, plus the approved payments on that
 * enrolment. No parallel access system is introduced.
 */
export class PrismaCourseAccessChecker implements CourseAccessChecker {
  async checkCourseAccess(studentId: string, courseId: string, asOf: Date): Promise<CourseAccess> {
    const rows = await prisma.enrollment.findMany({
      where: { studentId, semester: { courseId } },
      select: ENROLLMENT_SELECT,
    });

    return decideCourseAccess(rows.map(toFacts), asOf);
  }

  async listCourseAccess(studentId: string, asOf: Date): Promise<Map<string, CourseAccess>> {
    const rows = await prisma.enrollment.findMany({
      where: { studentId },
      select: ENROLLMENT_SELECT,
    });

    // A student can hold several enrolments in one course (successive
    // semesters), so they are judged together rather than one at a time.
    const byCourse = new Map<string, EnrollmentAccessFacts[]>();
    for (const row of rows) {
      const courseId = row.semester.courseId;
      const facts = byCourse.get(courseId) ?? [];
      facts.push(toFacts(row));
      byCourse.set(courseId, facts);
    }

    return new Map(
      [...byCourse].map(([courseId, facts]) => [courseId, decideCourseAccess(facts, asOf)]),
    );
  }
}
