import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import type { PaymentRepository } from "@/modules/payments/domain/payment-repository";
import type { EnrollmentRepository } from "@/modules/enrollments/domain/enrollment-repository";
import type { SemesterRepository } from "@/modules/semesters/domain/semester-repository";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { ClassSessionRepository } from "@/modules/scheduling/domain/class-session-repository";
import type { AttendanceRepository } from "@/modules/attendance/domain/attendance-repository";
import type { SessionType } from "@/modules/courses/domain/session-type";
import type { PaymentStatus } from "@/modules/payments/domain/payment-method";

export type StudentCourseSummary = {
  readonly courseTitle: string;
  readonly sessionType: SessionType;
  readonly paymentStatus: PaymentStatus | "UNPAID";
  readonly attendedCount: number;
  readonly totalSessions: number;
};

export type GetStudentCourseSummariesDeps = {
  readonly enrollmentRepository: EnrollmentRepository;
  readonly semesterRepository: SemesterRepository;
  readonly courseRepository: CourseRepository;
  readonly classSessionRepository: ClassSessionRepository;
  readonly attendanceRepository: AttendanceRepository;
  readonly paymentRepository: PaymentRepository;
};

export async function getStudentCourseSummaries(
  deps: GetStudentCourseSummariesDeps,
  studentId: string,
): Promise<StudentCourseSummary[]> {
  const currentMonth = normalizeToMonthStart(new Date());
  const enrollments = await deps.enrollmentRepository.findByStudent(studentId);

  const summaries = await Promise.all(
    enrollments.map(async (enrollment) => {
      const semester = await deps.semesterRepository.findById(enrollment.semesterId);
      if (!semester) return null;
      const course = await deps.courseRepository.findById(semester.courseId);
      if (!course) return null;

      const [payment, classSessions] = await Promise.all([
        deps.paymentRepository.findByEnrollmentAndMonth(enrollment.id, currentMonth),
        deps.classSessionRepository.findByCourse(course.id),
      ]);

      const attendanceRecords = await Promise.all(
        classSessions.map((classSession) =>
          deps.attendanceRepository.findByStudentAndSession(studentId, classSession.id),
        ),
      );
      const attendedCount = attendanceRecords.filter(
        (record) => record?.status === "PRESENT",
      ).length;

      return {
        courseTitle: course.title,
        sessionType: course.sessionType,
        paymentStatus: payment?.status ?? ("UNPAID" as const),
        attendedCount,
        totalSessions: classSessions.length,
      };
    }),
  );

  return summaries.filter((summary) => summary !== null);
}
