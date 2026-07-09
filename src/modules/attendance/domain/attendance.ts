export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT"] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type Attendance = {
  readonly id: string;
  readonly studentId: string;
  readonly sessionId: string;
  readonly status: AttendanceStatus;
  readonly checkInTime: Date | null;
  readonly checkOutTime: Date | null;
};
