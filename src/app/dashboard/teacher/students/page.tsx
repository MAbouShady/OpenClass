import { auth } from "@/auth";
import { listCoursesForTeacher } from "@/modules/courses/application/list-courses-for-teacher";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { listSemestersForCourse } from "@/modules/semesters/application/list-semesters-for-course";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { listClassSessionsForCourse } from "@/modules/scheduling/application/list-class-sessions-for-course";
import { PrismaClassSessionRepository } from "@/modules/scheduling/infrastructure/prisma-class-session-repository";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import { PrismaPaymentRepository } from "@/modules/payments/infrastructure/prisma-payment-repository";
import { PrismaAttendanceRepository } from "@/modules/attendance/infrastructure/prisma-attendance-repository";
import { filterStudentRows } from "@/modules/roster/application/filter-student-rows";
import { RosterFilterBar } from "@/modules/roster/presentation/roster-filter-bar";
import { RosterRow } from "@/modules/roster/presentation/roster-row";
import type { StudentRow } from "@/modules/roster/domain/student-row";
import { markCashPaymentAction } from "@/app/dashboard/teacher/courses/[courseId]/payments/actions";
import { Card, CardContent } from "@/components/ui/card";

const courseRepository = new PrismaCourseRepository();
const semesterRepository = new PrismaSemesterRepository();
const classSessionRepository = new PrismaClassSessionRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();
const userRepository = new PrismaUserRepository();
const paymentRepository = new PrismaPaymentRepository();
const attendanceRepository = new PrismaAttendanceRepository();

type PageProps = {
  readonly searchParams: Promise<Record<string, string | undefined>>;
};

export default async function TeacherStudentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const teacherId = session?.user.id ?? "";
  const currentMonth = normalizeToMonthStart(new Date());

  const courses = await listCoursesForTeacher({ courseRepository }, teacherId);

  const rows: StudentRow[] = [];
  for (const course of courses) {
    const [semesters, classSessions] = await Promise.all([
      listSemestersForCourse({ semesterRepository }, course.id),
      listClassSessionsForCourse({ classSessionRepository }, course.id),
    ]);

    const attendanceLists = await Promise.all(
      classSessions.map((classSession) => attendanceRepository.findBySession(classSession.id)),
    );
    const presentCountByStudent = new Map<string, number>();
    for (const list of attendanceLists) {
      for (const record of list) {
        if (record.status === "PRESENT") {
          presentCountByStudent.set(
            record.studentId,
            (presentCountByStudent.get(record.studentId) ?? 0) + 1,
          );
        }
      }
    }

    for (const semester of semesters) {
      const enrollments = await enrollmentRepository.findBySemester(semester.id);
      for (const enrollment of enrollments) {
        const [student, payment] = await Promise.all([
          userRepository.findById(enrollment.studentId),
          paymentRepository.findByEnrollmentAndMonth(enrollment.id, currentMonth),
        ]);

        rows.push({
          enrollmentId: enrollment.id,
          studentId: enrollment.studentId,
          studentEmail: student?.email ?? enrollment.studentId,
          courseId: course.id,
          courseTitle: course.title,
          sessionType: course.sessionType,
          semesterId: semester.id,
          paymentStatus: payment?.status ?? "UNPAID",
          attendedCount: presentCountByStudent.get(enrollment.studentId) ?? 0,
          totalSessions: classSessions.length,
        });
      }
    }
  }

  const filteredRows = filterStudentRows(rows, {
    courseId: params.courseId,
    semesterId: params.semesterId,
    sessionType:
      params.sessionType === "ONLINE" || params.sessionType === "OFFLINE"
        ? params.sessionType
        : undefined,
    paymentStatus:
      params.paymentStatus === "APPROVED" ||
      params.paymentStatus === "PENDING" ||
      params.paymentStatus === "UNPAID"
        ? params.paymentStatus
        : undefined,
  });

  const courseOptions = courses.map((course) => ({ value: course.id, label: course.title }));
  const semesterOptions = Array.from(new Set(rows.map((row) => row.semesterId))).map((id) => ({
    value: id,
    label: id,
  }));

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Students</h1>
        <p className="text-sm text-muted-foreground">
          All students across your courses and semesters.
        </p>
      </div>

      <RosterFilterBar courseOptions={courseOptions} semesterOptions={semesterOptions} />

      <Card>
        <CardContent className="p-6">
          {filteredRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students match these filters.</p>
          ) : (
            <div>
              {filteredRows.map((row) => (
                <RosterRow
                  key={row.enrollmentId}
                  row={row}
                  markCashAction={markCashPaymentAction.bind(
                    null,
                    row.courseId,
                    row.enrollmentId,
                    currentMonth.toISOString(),
                  )}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
