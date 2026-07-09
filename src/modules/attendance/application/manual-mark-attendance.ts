import type { Attendance } from "@/modules/attendance/domain/attendance";
import type { AttendanceRepository } from "@/modules/attendance/domain/attendance-repository";
import {
  manualMarkAttendanceSchema,
  type ManualMarkAttendanceSchemaInput,
} from "@/modules/attendance/application/manual-mark-attendance.schema";

export type ManualMarkAttendanceDeps = {
  readonly attendanceRepository: AttendanceRepository;
};

export async function manualMarkAttendance(
  deps: ManualMarkAttendanceDeps,
  input: ManualMarkAttendanceSchemaInput,
): Promise<Attendance> {
  const { studentId, sessionId, status } = manualMarkAttendanceSchema.parse(input);

  const existing = await deps.attendanceRepository.findByStudentAndSession(studentId, sessionId);
  if (existing) {
    return deps.attendanceRepository.update(existing.id, { status });
  }

  return deps.attendanceRepository.create({
    studentId,
    sessionId,
    status,
    checkInTime: null,
    checkOutTime: null,
  });
}
