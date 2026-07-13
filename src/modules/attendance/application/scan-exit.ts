import { err, ok, type Result } from "@/shared/domain/result";
import {
  AlreadyCheckedOutError,
  InvalidQrTokenError,
  NotCheckedInError,
  SessionNotFoundError,
} from "@/modules/attendance/domain/errors";
import type { Attendance } from "@/modules/attendance/domain/attendance";
import type { AttendanceRepository } from "@/modules/attendance/domain/attendance-repository";
import type { StudentRepository } from "@/modules/students/domain/student-repository";
import type { ClassSessionRepository } from "@/modules/scheduling/domain/class-session-repository";
import {
  scanExitSchema,
  type ScanExitSchemaInput,
} from "@/modules/attendance/application/scan-entry.schema";

export type ScanExitDeps = {
  readonly attendanceRepository: AttendanceRepository;
  readonly classSessionRepository: ClassSessionRepository;
  readonly studentRepository: StudentRepository;
};

export async function scanExit(
  deps: ScanExitDeps,
  input: ScanExitSchemaInput,
): Promise<
  Result<
    Attendance,
    | InvalidQrTokenError
    | SessionNotFoundError
    | NotCheckedInError
    | AlreadyCheckedOutError
  >
> {
  const { qrToken, sessionId } = scanExitSchema.parse(input);

  const idNumber = parseInt(qrToken.trim(), 10);
  if (isNaN(idNumber)) return err(new InvalidQrTokenError());

  const student = await deps.studentRepository.findByIdNumber(idNumber);
  if (!student) return err(new InvalidQrTokenError());

  const session = await deps.classSessionRepository.findById(sessionId);
  if (!session) return err(new SessionNotFoundError(sessionId));

  const existing = await deps.attendanceRepository.findByStudentAndSession(student.id, sessionId);
  if (!existing?.checkInTime) return err(new NotCheckedInError());
  if (existing.checkOutTime) return err(new AlreadyCheckedOutError());

  const attendance = await deps.attendanceRepository.update(existing.id, {
    checkOutTime: new Date(),
  });

  return ok(attendance);
}
