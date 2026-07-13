import { describe, expect, it } from "vitest";
import { deleteCourse } from "@/modules/courses/application/delete-course";
import { CourseForbiddenError, CourseNotFoundError } from "@/modules/courses/domain/errors";
import { FakeCourseRepository } from "./fake-course-repository";

const SEED = [
  {
    id: "course-1",
    title: "Intro to Python",
    description: null,
    sessionType: "ONLINE" as const,
    paymentFrequency: "MONTHLY" as const,
  price: null,
    levelId: "level-1",
    teacherId: "teacher-1",
  },
];

describe("deleteCourse", () => {
  it("allows the owning teacher to delete their course", async () => {
    const courseRepository = new FakeCourseRepository([...SEED]);

    const result = await deleteCourse(
      { courseRepository },
      { userId: "teacher-1", isAdmin: false },
      { id: "course-1" },
    );

    expect(result.ok).toBe(true);
    await expect(courseRepository.findById("course-1")).resolves.toBeNull();
  });

  it("rejects a teacher deleting another teacher's course", async () => {
    const courseRepository = new FakeCourseRepository([...SEED]);

    const result = await deleteCourse(
      { courseRepository },
      { userId: "teacher-2", isAdmin: false },
      { id: "course-1" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(CourseForbiddenError);
  });

  it("rejects deleting a course that does not exist", async () => {
    const courseRepository = new FakeCourseRepository();

    const result = await deleteCourse(
      { courseRepository },
      { userId: "teacher-1", isAdmin: false },
      { id: "missing" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(CourseNotFoundError);
  });
});
