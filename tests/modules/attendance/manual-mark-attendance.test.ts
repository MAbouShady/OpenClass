import { describe, expect, it } from "vitest";
import { manualMarkAttendance } from "@/modules/attendance/application/manual-mark-attendance";
import { FakeAttendanceRepository } from "./fake-attendance-repository";

describe("manualMarkAttendance", () => {
  it("creates a new attendance record when none exists", async () => {
    const attendanceRepository = new FakeAttendanceRepository();

    const attendance = await manualMarkAttendance(
      { attendanceRepository },
      { studentId: "student-1", sessionId: "session-1", status: "PRESENT" },
    );

    expect(attendance).toMatchObject({ status: "PRESENT", checkInTime: null });
  });

  it("updates the status of an existing record", async () => {
    const attendanceRepository = new FakeAttendanceRepository([
      {
        id: "attendance-1",
        studentId: "student-1",
        sessionId: "session-1",
        status: "PRESENT",
        checkInTime: null,
        checkOutTime: null,
      },
    ]);

    const attendance = await manualMarkAttendance(
      { attendanceRepository },
      { studentId: "student-1", sessionId: "session-1", status: "ABSENT" },
    );

    expect(attendance.status).toBe("ABSENT");
    expect(attendance.id).toBe("attendance-1");
  });
});
