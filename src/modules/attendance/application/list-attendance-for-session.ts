import type { Attendance } from "@/modules/attendance/domain/attendance";
import type { AttendanceRepository } from "@/modules/attendance/domain/attendance-repository";

export type ListAttendanceForSessionDeps = {
  readonly attendanceRepository: AttendanceRepository;
};

export function listAttendanceForSession(
  deps: ListAttendanceForSessionDeps,
  sessionId: string,
): Promise<Attendance[]> {
  return deps.attendanceRepository.findBySession(sessionId);
}
