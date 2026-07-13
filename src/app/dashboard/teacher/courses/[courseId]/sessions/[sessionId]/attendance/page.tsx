import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { PrismaClassSessionRepository } from "@/modules/scheduling/infrastructure/prisma-class-session-repository";
import { listSemestersForCourse } from "@/modules/semesters/application/list-semesters-for-course";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { listAttendanceForSession } from "@/modules/attendance/application/list-attendance-for-session";
import { PrismaAttendanceRepository } from "@/modules/attendance/infrastructure/prisma-attendance-repository";
import { ScanForm } from "@/modules/attendance/presentation/scan-form";
import { AttendanceStudentList } from "@/modules/attendance/presentation/attendance-student-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student-repository";
import { markAttendanceAction, scanEntryAction, scanExitAction } from "./actions";

const courseRepository = new PrismaCourseRepository();
const classSessionRepository = new PrismaClassSessionRepository();
const semesterRepository = new PrismaSemesterRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();
const studentRepository = new PrismaStudentRepository();
const attendanceRepository = new PrismaAttendanceRepository();

type PageProps = {
  readonly params: Promise<{ courseId: string; sessionId: string }>;
};

export default async function SessionAttendancePage({ params }: PageProps) {
  const { courseId, sessionId } = await params;
  const [session, t] = await Promise.all([auth(), getTranslations("attendance")]);
  const course = await courseRepository.findById(courseId);
  const classSession = await classSessionRepository.findById(sessionId);

  if (!course || !classSession || classSession.courseId !== courseId) notFound();
  if (session?.user.role !== "ADMIN" && course.teacherId !== session?.user.id) notFound();

  const semesters = await listSemestersForCourse({ semesterRepository }, courseId);
  const enrollmentLists = await Promise.all(
    semesters.map((semester) => enrollmentRepository.findBySemester(semester.id)),
  );
  const enrollments = enrollmentLists.flat();

  const attendanceRecords = await listAttendanceForSession({ attendanceRepository }, sessionId);
  const attendanceByStudentId = new Map(
    attendanceRecords.map((attendance) => [attendance.studentId, attendance]),
  );

  const rows = await Promise.all(
    enrollments.map(async (enrollment) => {
      const student = await studentRepository.findById(enrollment.studentId);
      const attendance = attendanceByStudentId.get(enrollment.studentId);
      return {
        studentId: enrollment.studentId,
        studentName: student?.name ?? enrollment.studentId,
        studentIdNumber: student?.idNumber ?? null,
        status: attendance?.status ?? ("UNMARKED" as const),
        checkInTime: attendance?.checkInTime ?? null,
        checkOutTime: attendance?.checkOutTime ?? null,
        markPresentAction: markAttendanceAction.bind(null, courseId, sessionId, enrollment.studentId, "PRESENT"),
        markAbsentAction: markAttendanceAction.bind(null, courseId, sessionId, enrollment.studentId, "ABSENT"),
      };
    }),
  );

  const boundScanEntry = scanEntryAction.bind(null, courseId, sessionId);
  const boundScanExit = scanExitAction.bind(null, courseId, sessionId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("pageTitle")} — {course.title}</h1>
        <p className="text-muted-foreground">
          {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(
            classSession.startTime,
          )}
        </p>
      </div>

      {course.sessionType === "OFFLINE" ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("scanQr")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScanForm label={t("checkIn")} action={boundScanEntry} />
            <ScanForm label={t("checkOut")} action={boundScanExit} />
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">{t("onlineSessionNote")}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("studentsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceStudentList rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
