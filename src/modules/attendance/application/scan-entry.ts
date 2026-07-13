import { err, ok, type Result } from "@/shared/domain/result";
import {
  AlreadyCheckedInError,
  EnrollmentRequiredError,
  InvalidQrTokenError,
  OnlineSessionScanNotAllowedError,
  PaymentRequiredError,
  SessionNotFoundError,
} from "@/modules/attendance/domain/errors";
import type { Attendance } from "@/modules/attendance/domain/attendance";
import type { AttendanceRepository } from "@/modules/attendance/domain/attendance-repository";
import type { StudentRepository } from "@/modules/students/domain/student-repository";
import { isEnrollmentBlocked } from "@/modules/payments/application/is-enrollment-blocked";
import type { PaymentRepository } from "@/modules/payments/domain/payment-repository";
import type { ClassSessionRepository } from "@/modules/scheduling/domain/class-session-repository";
import type { CourseRepository } from "@/modules/courses/domain/course-repository";
import type { SemesterRepository } from "@/modules/semesters/domain/semester-repository";
import type { EnrollmentRepository } from "@/modules/enrollments/domain/enrollment-repository";
import {
  scanEntrySchema,
  type ScanEntrySchemaInput,
} from "@/modules/attendance/application/scan-entry.schema";

export type ScanEntryDeps = {
  readonly attendanceRepository: AttendanceRepository;
  readonly classSessionRepository: ClassSessionRepository;
  readonly courseRepository: CourseRepository;
  readonly semesterRepository: SemesterRepository;
  readonly enrollmentRepository: EnrollmentRepository;
  readonly paymentRepository: PaymentRepository;
  readonly studentRepository: StudentRepository;
};

export async function scanEntry(
  deps: ScanEntryDeps,
  input: ScanEntrySchemaInput,
): Promise<
  Result<
    Attendance,
    | InvalidQrTokenError
    | SessionNotFoundError
    | OnlineSessionScanNotAllowedError
    | EnrollmentRequiredError
    | PaymentRequiredError
    | AlreadyCheckedInError
  >
> {
  const { qrToken, sessionId } = scanEntrySchema.parse(input);

  const idNumber = parseInt(qrToken.trim(), 10);
  if (isNaN(idNumber)) return err(new InvalidQrTokenError());

  const student = await deps.studentRepository.findByIdNumber(idNumber);
  if (!student) return err(new InvalidQrTokenError());

  const session = await deps.classSessionRepository.findById(sessionId);
  if (!session) return err(new SessionNotFoundError(sessionId));

  const course = await deps.courseRepository.findById(session.courseId);
  if (course?.sessionType === "ONLINE") return err(new OnlineSessionScanNotAllowedError());

  const semesters = await deps.semesterRepository.findByCourse(session.courseId);
  let enrollment = null;
  for (const semester of semesters) {
    const found = await deps.enrollmentRepository.findByStudentAndSemester(
      student.id,
      semester.id,
    );
    if (found) { enrollment = found; break; }
  }
  if (!enrollment) return err(new EnrollmentRequiredError());

  const blocked = await isEnrollmentBlocked(
    { paymentRepository: deps.paymentRepository },
    enrollment.id,
    new Date(),
  );
  if (blocked) return err(new PaymentRequiredError());

  const existing = await deps.attendanceRepository.findByStudentAndSession(student.id, sessionId);
  if (existing?.checkInTime) return err(new AlreadyCheckedInError());

  const attendance = existing
    ? await deps.attendanceRepository.update(existing.id, {
        status: "PRESENT",
        checkInTime: new Date(),
      })
    : await deps.attendanceRepository.create({
        studentId: student.id,
        sessionId,
        status: "PRESENT",
        checkInTime: new Date(),
        checkOutTime: null,
      });

  return ok(attendance);
}
