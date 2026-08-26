import { prisma } from "@/shared/infrastructure/prisma/client";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import type {
  CourseStudentCounts,
  CourseStudentCountsReader,
} from "@/modules/payments/domain/course-student-counts";
import { isPeriodPaid } from "@/modules/recordings/domain/course-access-rules";

/**
 * Counts enrolled and paid students per course in one query.
 *
 * "Paid" is decided by the same rule that unlocks recorded lessons, so the
 * number on a course card can never disagree with what a student can open.
 */
export class PrismaCourseStudentCountsReader implements CourseStudentCountsReader {
  async forTeacher(teacherId: string, asOf: Date): Promise<Map<string, CourseStudentCounts>> {
    const rows = await prisma.enrollment.findMany({
      where: { semester: { course: { teacherId } } },
      select: {
        id: true,
        studentId: true,
        semesterId: true,
        semester: {
          select: {
            courseId: true,
            startDate: true,
            course: { select: { paymentFrequency: true } },
          },
        },
        payments: { where: { status: "APPROVED" }, select: { month: true } },
      },
    });

    // A student can hold several enrolments in one course (successive
    // semesters), so both figures count distinct students, and one paid
    // enrolment is enough to count them as paid.
    const enrolledByCourse = new Map<string, Set<string>>();
    const paidByCourse = new Map<string, Set<string>>();

    for (const row of rows) {
      const courseId = row.semester.courseId;

      if (!enrolledByCourse.has(courseId)) enrolledByCourse.set(courseId, new Set());
      enrolledByCourse.get(courseId)!.add(row.studentId);

      const paid = isPeriodPaid(
        {
          enrollmentId: row.id,
          semesterId: row.semesterId,
          semesterStartDate: row.semester.startDate,
          paymentFrequency: row.semester.course.paymentFrequency,
          approvedMonths: row.payments.map((payment) => normalizeToMonthStart(payment.month)),
        },
        asOf,
      );

      if (paid) {
        if (!paidByCourse.has(courseId)) paidByCourse.set(courseId, new Set());
        paidByCourse.get(courseId)!.add(row.studentId);
      }
    }

    const counts = new Map<string, CourseStudentCounts>();
    for (const [courseId, students] of enrolledByCourse) {
      counts.set(courseId, {
        enrolled: students.size,
        paid: paidByCourse.get(courseId)?.size ?? 0,
      });
    }
    return counts;
  }
}
