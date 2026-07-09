import { describe, expect, it } from "vitest";
import { createSemester } from "@/modules/semesters/application/create-semester";
import { InvalidSemesterDateRangeError } from "@/modules/semesters/domain/errors";
import { FakeSemesterRepository } from "./fake-semester-repository";

describe("createSemester", () => {
  it("creates a semester when end is after start", async () => {
    const semesterRepository = new FakeSemesterRepository();

    const result = await createSemester(
      { semesterRepository },
      { courseId: "course-1", startDate: new Date("2026-01-01"), endDate: new Date("2026-04-01") },
    );

    expect(result.ok).toBe(true);
  });

  it("rejects when end is not after start", async () => {
    const semesterRepository = new FakeSemesterRepository();

    const result = await createSemester(
      { semesterRepository },
      { courseId: "course-1", startDate: new Date("2026-04-01"), endDate: new Date("2026-01-01") },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidSemesterDateRangeError);
  });
});
