// @vitest-environment node
import { describe, expect, it } from "vitest";
import { scanExit } from "@/modules/attendance/application/scan-exit";
import { AlreadyCheckedOutError, NotCheckedInError } from "@/modules/attendance/domain/errors";
import { FakeAttendanceRepository } from "./fake-attendance-repository";
import { FakeClassSessionRepository } from "../scheduling/fake-class-session-repository";
import { FakeStudentRepository } from "./fake-student-repository";

const STUDENT = {
  id: "student-1",
  idNumber: 123456,
  name: "Test Student",
  email: "test@test.com",
  phone: null,
  levelId: null,
  levelName: null,
  parentId: null,
  parentName: null,
  parentEmail: null,
};

const QR = "123456";

const CLASS_SESSION = {
  id: "session-1",
  courseId: "course-1",
  semesterId: "semester-1",
  startTime: new Date("2026-01-01T10:00:00Z"),
  endTime: new Date("2026-01-01T11:00:00Z"),
};

const studentRepository = new FakeStudentRepository([STUDENT]);

describe("scanExit", () => {
  it("checks out a checked-in student", async () => {
    const attendanceRepository = new FakeAttendanceRepository([
      {
        id: "attendance-1",
        studentId: "student-1",
        sessionId: "session-1",
        status: "PRESENT",
        checkInTime: new Date("2026-01-01T10:05:00Z"),
        checkOutTime: null,
      },
    ]);
    const classSessionRepository = new FakeClassSessionRepository([CLASS_SESSION]);

    const result = await scanExit(
      { attendanceRepository, classSessionRepository, studentRepository },
      { qrToken: QR, sessionId: "session-1" },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.checkOutTime).not.toBeNull();
  });

  it("rejects checking out a student who never checked in", async () => {
    const attendanceRepository = new FakeAttendanceRepository();
    const classSessionRepository = new FakeClassSessionRepository([CLASS_SESSION]);

    const result = await scanExit(
      { attendanceRepository, classSessionRepository, studentRepository },
      { qrToken: QR, sessionId: "session-1" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(NotCheckedInError);
  });

  it("rejects checking out twice", async () => {
    const attendanceRepository = new FakeAttendanceRepository([
      {
        id: "attendance-1",
        studentId: "student-1",
        sessionId: "session-1",
        status: "PRESENT",
        checkInTime: new Date("2026-01-01T10:05:00Z"),
        checkOutTime: new Date("2026-01-01T10:55:00Z"),
      },
    ]);
    const classSessionRepository = new FakeClassSessionRepository([CLASS_SESSION]);

    const result = await scanExit(
      { attendanceRepository, classSessionRepository, studentRepository },
      { qrToken: QR, sessionId: "session-1" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(AlreadyCheckedOutError);
  });
});
