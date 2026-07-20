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
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student-repository";
import { listStudentsForTeacher } from "@/modules/students/application/list-students-for-teacher";
import { filterStudentRows } from "@/modules/roster/application/filter-student-rows";
import { RosterFilterBar } from "@/modules/roster/presentation/roster-filter-bar";
import { RosterRow } from "@/modules/roster/presentation/roster-row";
import { RosterPagination } from "@/modules/roster/presentation/roster-pagination";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import type { StudentRow } from "@/modules/roster/domain/student-row";
import { markCashPaymentAction } from "@/app/dashboard/teacher/courses/[courseId]/payments/actions";
import { unenrollStudentAction } from "@/app/dashboard/teacher/students/actions";

const studentRepository = new PrismaStudentRepository();
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

export default async function TeacherRosterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const teacherId = session?.user.id ?? "";
  const currentMonth = normalizeToMonthStart(new Date());

  const [students, courses, t] = await Promise.all([
    listStudentsForTeacher({ studentRepository }, teacherId),
    listCoursesForTeacher({ courseRepository }, teacherId),
    getTranslations("students"),
  ]);

  const allSemesters = await Promise.all(
    courses.map((c) => listSemestersForCourse({ semesterRepository }, c.id)),
  );
  const semestersByCourse = new Map(courses.map((c, i) => [c.id, allSemesters[i]!]));

  const studentInfoMap = new Map(
    students.map((s) => [s.id, { name: s.name, idNumber: s.idNumber }]),
  );

  const rows: StudentRow[] = [];
  for (const course of courses) {
    const [semesters, classSessions] = await Promise.all([
      Promise.resolve(semestersByCourse.get(course.id) ?? []),
      listClassSessionsForCourse({ classSessionRepository }, course.id),
    ]);

    const attendanceLists = await Promise.all(
      classSessions.map((cs) => attendanceRepository.findBySession(cs.id)),
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

        const info = studentInfoMap.get(enrollment.studentId);
        rows.push({
          enrollmentId: enrollment.id,
          studentId: enrollment.studentId,
          studentName: info?.name ?? null,
          studentIdNumber: info?.idNumber ?? null,
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

  const ROSTER_PAGE_SIZE = 20;
  const rosterPage = Math.max(1, parseInt(params.rosterPage ?? "1", 10));

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

  const rosterTotalPages = Math.max(1, Math.ceil(filteredRows.length / ROSTER_PAGE_SIZE));
  const safePage = Math.min(rosterPage, rosterTotalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * ROSTER_PAGE_SIZE, safePage * ROSTER_PAGE_SIZE);

  const filterCourseOptions = courses.map((c) => ({ value: c.id, label: c.title }));
  const semesterLabelById = new Map(
    allSemesters.flat().map((s) => [
      s.id,
      `${s.startDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })} — ${s.endDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`,
    ]),
  );
  const semesterOptions = Array.from(new Set(rows.map((r) => r.semesterId))).map((id) => ({
    value: id,
    label: semesterLabelById.get(id) ?? id,
  }));

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{t("rosterTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("rosterSubtitle")}</p>
      </div>

      <RosterFilterBar courseOptions={filterCourseOptions} semesterOptions={semesterOptions} />

      <Card>
        <CardContent className="p-6">
          {filteredRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noFilterResults")}</p>
          ) : (
            <div className="flex flex-col gap-0">
              {paginatedRows.map((row) => (
                <RosterRow
                  key={row.enrollmentId}
                  row={row}
                  markCashAction={markCashPaymentAction.bind(
                    null,
                    row.courseId,
                    row.enrollmentId,
                    currentMonth.toISOString(),
                  )}
                  unenrollAction={unenrollStudentAction}
                />
              ))}
              <RosterPagination
                page={safePage}
                totalPages={rosterTotalPages}
                total={filteredRows.length}
                searchParams={params}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
