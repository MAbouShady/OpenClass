import { err, ok, type Result } from "@/shared/domain/result";
import {
  AlreadyCheckedOutError,
  InvalidQrTokenError,
  NotCheckedInError,
  SessionNotFoundError,
  WrongCourseError,
} from "@/modules/attendance/domain/errors";
import type { Attendance } from "@/modules/attendance/domain/attendance";
import type { AttendanceRepository } from "@/modules/attendance/domain/attendance-repository";
import { verifyQrToken } from "@/modules/qr/domain/qr-token";
import type { ClassSessionRepository } from "@/modules/scheduling/domain/class-session-repository";
import {
  scanExitSchema,
  type ScanExitSchemaInput,
} from "@/modules/attendance/application/scan-entry.schema";

export type ScanExitDeps = {
  readonly attendanceRepository: AttendanceRepository;
  readonly classSessionRepository: ClassSessionRepository;
};

export async function scanExit(
  deps: ScanExitDeps,
  input: ScanExitSchemaInput,
): Promise<
  Result<
    Attendance,
    | InvalidQrTokenError
    | SessionNotFoundError
    | WrongCourseError
    | NotCheckedInError
    | AlreadyCheckedOutError
  >
> {
  const { qrToken, sessionId } = scanExitSchema.parse(input);

  const payload = verifyQrToken(qrToken);
  if (!payload) {
    return err(new InvalidQrTokenError());
  }

  const session = await deps.classSessionRepository.findById(sessionId);
  if (!session) {
    return err(new SessionNotFoundError(sessionId));
  }

  if (session.courseId !== payload.courseId) {
    return err(new WrongCourseError());
  }

  const existing = await deps.attendanceRepository.findByStudentAndSession(
    payload.studentId,
    sessionId,
  );
  if (!existing?.checkInTime) {
    return err(new NotCheckedInError());
  }
  if (existing.checkOutTime) {
    return err(new AlreadyCheckedOutError());
  }

  const attendance = await deps.attendanceRepository.update(existing.id, {
    checkOutTime: new Date(),
  });

  return ok(attendance);
}
