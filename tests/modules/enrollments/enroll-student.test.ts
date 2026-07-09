import { describe, expect, it } from "vitest";
import { enrollStudent } from "@/modules/enrollments/application/enroll-student";
import {
  AlreadyEnrolledError,
  EnrollmentSemesterNotFoundError,
} from "@/modules/enrollments/domain/errors";
import { FakeSemesterRepository } from "../semesters/fake-semester-repository";
import { FakeEnrollmentRepository } from "./fake-enrollment-repository";

const SEED_SEMESTER = {
  id: "semester-1",
  courseId: "course-1",
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-04-01"),
};

describe("enrollStudent", () => {
  it("enrolls a student in an existing semester", async () => {
    const semesterRepository = new FakeSemesterRepository([SEED_SEMESTER]);
    const enrollmentRepository = new FakeEnrollmentRepository();

    const result = await enrollStudent(
      { enrollmentRepository, semesterRepository },
      { studentId: "student-1", semesterId: "semester-1" },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ studentId: "student-1", semesterId: "semester-1" });
  });

  it("rejects enrolling in a semester that does not exist", async () => {
    const semesterRepository = new FakeSemesterRepository();
    const enrollmentRepository = new FakeEnrollmentRepository();

    const result = await enrollStudent(
      { enrollmentRepository, semesterRepository },
      { studentId: "student-1", semesterId: "missing" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(EnrollmentSemesterNotFoundError);
  });

  it("rejects enrolling twice in the same semester", async () => {
    const semesterRepository = new FakeSemesterRepository([SEED_SEMESTER]);
    const enrollmentRepository = new FakeEnrollmentRepository([
      { id: "enrollment-1", studentId: "student-1", semesterId: "semester-1" },
    ]);

    const result = await enrollStudent(
      { enrollmentRepository, semesterRepository },
      { studentId: "student-1", semesterId: "semester-1" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(AlreadyEnrolledError);
  });
});
