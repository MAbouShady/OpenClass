import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { PrismaClassSessionRepository } from "@/modules/scheduling/infrastructure/prisma-class-session-repository";
import { listSemestersForCourse } from "@/modules/semesters/application/list-semesters-for-course";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { listAttendanceForSession } from "@/modules/attendance/application/list-attendance-for-session";
import { PrismaAttendanceRepository } from "@/modules/attendance/infrastructure/prisma-attendance-repository";
import { ScanForm } from "@/modules/attendance/presentation/scan-form";
import { AttendanceRow } from "@/modules/attendance/presentation/attendance-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { markAttendanceAction, scanEntryAction, scanExitAction } from "./actions";

const courseRepository = new PrismaCourseRepository();
const classSessionRepository = new PrismaClassSessionRepository();
const semesterRepository = new PrismaSemesterRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();
const userRepository = new PrismaUserRepository();
const attendanceRepository = new PrismaAttendanceRepository();

type PageProps = {
  readonly params: Promise<{ courseId: string; sessionId: string }>;
};

export default async function SessionAttendancePage({ params }: PageProps) {
  const { courseId, sessionId } = await params;
  const session = await auth();
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
      const student = await userRepository.findById(enrollment.studentId);
      const attendance = attendanceByStudentId.get(enrollment.studentId);
      return {
        studentId: enrollment.studentId,
        studentEmail: student?.email ?? enrollment.studentId,
        status: attendance?.status ?? ("UNMARKED" as const),
        checkInTime: attendance?.checkInTime ?? null,
        checkOutTime: attendance?.checkOutTime ?? null,
      };
    }),
  );

  const boundScanEntry = scanEntryAction.bind(null, courseId, sessionId);
  const boundScanExit = scanExitAction.bind(null, courseId, sessionId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance — {course.title}</h1>
        <p className="text-muted-foreground">
          {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
            classSession.startTime,
          )}
        </p>
      </div>

      {course.sessionType === "OFFLINE" ? (
        <Card>
          <CardHeader>
            <CardTitle>Scan QR code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScanForm label="Check in" action={boundScanEntry} />
            <ScanForm label="Check out" action={boundScanExit} />
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          This is an online session — mark attendance manually below.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enrolled students yet.</p>
          ) : (
            <div>
              {rows.map((row) => (
                <AttendanceRow
                  key={row.studentId}
                  studentEmail={row.studentEmail}
                  status={row.status}
                  checkInTime={row.checkInTime}
                  checkOutTime={row.checkOutTime}
                  markPresentAction={markAttendanceAction.bind(
                    null,
                    courseId,
                    sessionId,
                    row.studentId,
                    "PRESENT",
                  )}
                  markAbsentAction={markAttendanceAction.bind(
                    null,
                    courseId,
                    sessionId,
                    row.studentId,
                    "ABSENT",
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
