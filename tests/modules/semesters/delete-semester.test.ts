import { describe, expect, it } from "vitest";
import { deleteSemester } from "@/modules/semesters/application/delete-semester";
import { SemesterNotFoundError } from "@/modules/semesters/domain/errors";
import { FakeSemesterRepository } from "./fake-semester-repository";

describe("deleteSemester", () => {
  it("deletes an existing semester", async () => {
    const semesterRepository = new FakeSemesterRepository([
      {
        id: "semester-1",
        courseId: "course-1",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-04-01"),
      },
    ]);

    const result = await deleteSemester({ semesterRepository }, { id: "semester-1" });

    expect(result.ok).toBe(true);
    await expect(semesterRepository.findById("semester-1")).resolves.toBeNull();
  });

  it("rejects deleting a semester that does not exist", async () => {
    const semesterRepository = new FakeSemesterRepository();

    const result = await deleteSemester({ semesterRepository }, { id: "missing" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(SemesterNotFoundError);
  });
});
