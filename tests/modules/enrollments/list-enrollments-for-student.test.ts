import { describe, expect, it } from "vitest";
import { listEnrollmentsForStudent } from "@/modules/enrollments/application/list-enrollments-for-student";
import { FakeEnrollmentRepository } from "./fake-enrollment-repository";

describe("listEnrollmentsForStudent", () => {
  it("returns only enrollments for the given student", async () => {
    const enrollmentRepository = new FakeEnrollmentRepository([
      { id: "enrollment-1", studentId: "student-1", semesterId: "semester-1" },
      { id: "enrollment-2", studentId: "student-2", semesterId: "semester-1" },
    ]);

    const enrollments = await listEnrollmentsForStudent({ enrollmentRepository }, "student-1");

    expect(enrollments.map((enrollment) => enrollment.id)).toEqual(["enrollment-1"]);
  });
});
