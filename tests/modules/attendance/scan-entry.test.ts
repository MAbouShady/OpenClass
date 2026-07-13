// @vitest-environment node
import { describe, expect, it } from "vitest";
import { scanEntry } from "@/modules/attendance/application/scan-entry";
import {
  AlreadyCheckedInError,
  EnrollmentRequiredError,
  InvalidQrTokenError,
  OnlineSessionScanNotAllowedError,
  PaymentRequiredError,
} from "@/modules/attendance/domain/errors";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import type { Course } from "@/modules/courses/domain/course";
import { FakeAttendanceRepository } from "./fake-attendance-repository";
import { FakeClassSessionRepository } from "../scheduling/fake-class-session-repository";
import { FakeCourseRepository } from "../courses/fake-course-repository";
import { FakeSemesterRepository } from "../semesters/fake-semester-repository";
import { FakeEnrollmentRepository } from "../enrollments/fake-enrollment-repository";
import { FakePaymentRepository } from "../payments/fake-payment-repository";
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

const COURSE = {
  id: "course-1",
  title: "Intro",
  description: null,
  sessionType: "OFFLINE" as const,
  paymentFrequency: "MONTHLY" as const,
  price: null,
  levelId: "level-1",
  teacherId: "teacher-1",
};

const ONLINE_COURSE = { ...COURSE, id: "course-2", sessionType: "ONLINE" as const };

const CLASS_SESSION = {
  id: "session-1",
  courseId: "course-1",
  semesterId: "semester-1",
  startTime: new Date("2026-01-01T10:00:00Z"),
  endTime: new Date("2026-01-01T11:00:00Z"),
};

const SEMESTER = {
  id: "semester-1",
  courseId: "course-1",
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-04-01"),
};

const ENROLLMENT = { id: "enrollment-1", studentId: "student-1", semesterId: "semester-1" };

const PAID_PAYMENT = {
  id: "payment-1",
  enrollmentId: "enrollment-1",
  month: normalizeToMonthStart(new Date()),
  method: "CASH" as const,
  status: "APPROVED" as const,
  proofUrl: null,
  approvedById: "teacher-1",
  notes: null,
};

function buildDeps(
  overrides: {
    paid?: boolean;
    enrolled?: boolean;
    course?: Course;
    classSession?: typeof CLASS_SESSION;
  } = {},
) {
  const { paid = true, enrolled = true, course = COURSE, classSession = CLASS_SESSION } = overrides;

  return {
    attendanceRepository: new FakeAttendanceRepository(),
    classSessionRepository: new FakeClassSessionRepository([classSession]),
    courseRepository: new FakeCourseRepository([course]),
    semesterRepository: new FakeSemesterRepository([SEMESTER]),
    enrollmentRepository: new FakeEnrollmentRepository(enrolled ? [ENROLLMENT] : []),
    paymentRepository: new FakePaymentRepository(paid ? [PAID_PAYMENT] : []),
    studentRepository: new FakeStudentRepository([STUDENT]),
  };
}

describe("scanEntry", () => {
  it("checks in a valid, enrolled, paid-up student", async () => {
    const result = await scanEntry(buildDeps(), { qrToken: QR, sessionId: "session-1" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("PRESENT");
    expect(result.value.checkInTime).not.toBeNull();
  });

  it("rejects a non-numeric token", async () => {
    const result = await scanEntry(buildDeps(), { qrToken: "garbage", sessionId: "session-1" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidQrTokenError);
  });

  it("rejects an unknown idNumber", async () => {
    const result = await scanEntry(buildDeps(), { qrToken: "999999", sessionId: "session-1" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidQrTokenError);
  });

  it("rejects scanning an online course's session", async () => {
    const deps = buildDeps({
      course: ONLINE_COURSE,
      classSession: { ...CLASS_SESSION, courseId: "course-2" },
    });

    const result = await scanEntry(deps, { qrToken: QR, sessionId: "session-1" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(OnlineSessionScanNotAllowedError);
  });

  it("rejects an unenrolled student", async () => {
    const result = await scanEntry(buildDeps({ enrolled: false }), { qrToken: QR, sessionId: "session-1" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(EnrollmentRequiredError);
  });

  it("rejects a student who hasn't paid this month", async () => {
    const result = await scanEntry(buildDeps({ paid: false }), { qrToken: QR, sessionId: "session-1" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(PaymentRequiredError);
  });

  it("rejects a second check-in for the same session", async () => {
    const deps = buildDeps();
    await scanEntry(deps, { qrToken: QR, sessionId: "session-1" });
    const result = await scanEntry(deps, { qrToken: QR, sessionId: "session-1" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(AlreadyCheckedInError);
  });
});
