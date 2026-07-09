import type { Attendance, AttendanceStatus } from "@/modules/attendance/domain/attendance";

export type CreateAttendanceInput = {
  readonly studentId: string;
  readonly sessionId: string;
  readonly status: AttendanceStatus;
  readonly checkInTime: Date | null;
  readonly checkOutTime: Date | null;
};

export type UpdateAttendanceInput = Partial<
  Pick<CreateAttendanceInput, "status" | "checkInTime" | "checkOutTime">
>;

export interface AttendanceRepository {
  findById(id: string): Promise<Attendance | null>;
  findByStudentAndSession(studentId: string, sessionId: string): Promise<Attendance | null>;
  findBySession(sessionId: string): Promise<Attendance[]>;
  create(input: CreateAttendanceInput): Promise<Attendance>;
  update(id: string, input: UpdateAttendanceInput): Promise<Attendance>;
}
