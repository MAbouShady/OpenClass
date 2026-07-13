import { auth } from "@/auth";
import { listStudentsForTeacher } from "@/modules/students/application/list-students-for-teacher";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student-repository";
import { listLevels } from "@/modules/levels/application/list-levels";
import { PrismaLevelRepository } from "@/modules/levels/infrastructure/prisma-level-repository";
import { AddStudentModal } from "@/modules/students/presentation/add-student-modal";
import { StudentSearchList } from "@/modules/students/presentation/student-search-list";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import {
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
  enrollStudentAction,
  unenrollStudentAction,
} from "@/app/dashboard/teacher/students/actions";

// Roster imports (existing view kept below)
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

const studentRepository = new PrismaStudentRepository();
const levelRepository = new PrismaLevelRepository();
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

  const [students, levels, courses, t] = await Promise.all([
    listStudentsForTeacher({ studentRepository }, teacherId),
    listLevels({ levelRepository }),
    listCoursesForTeacher({ courseRepository }, teacherId),
    getTranslations("students"),
  ]);

  const parents = await studentRepository.findAllParents();

  // Fetch semesters for all courses upfront — used by modal (latestSemesterId) + roster loop
  const allSemesters = await Promise.all(
    courses.map((c) => listSemestersForCourse({ semesterRepository }, c.id)),
  );
  const semestersByCourse = new Map(courses.map((c, i) => [c.id, allSemesters[i]!]));

  const courseOptions = courses.map((c) => {
    const semesters = semestersByCourse.get(c.id) ?? [];
    const latest = semesters.slice().sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )[0];
    return { id: c.id, title: c.title, latestSemesterId: latest?.id ?? null };
  });

  const studentInfoMap = new Map(
    students.map((s) => [s.id, { name: s.name, idNumber: s.idNumber }]),
  );

  // ── Roster (existing logic) ───────────────────────────────────────────
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
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* ── Student management ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
          </div>
          <AddStudentModal
            createAction={createStudentAction}
            levels={levels}
            parents={parents}
            courseOptions={courseOptions}
          />
        </div>

        <Card>
          <CardContent className="px-6 py-4">
            <StudentSearchList
              students={students}
              levels={levels}
              parents={parents}
              courseOptions={courseOptions}
              updateAction={updateStudentAction}
              enrollAction={enrollStudentAction}
              deleteAction={deleteStudentAction}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Attendance / payment roster ─────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t("rosterTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("rosterSubtitle")}</p>
        </div>

        <RosterFilterBar courseOptions={filterCourseOptions} semesterOptions={semesterOptions} />

        <Card>
          <CardContent className="p-6">
            {filteredRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noFilterResults")}</p>
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
                    unenrollAction={unenrollStudentAction}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
