import { describe, expect, it } from "vitest";
import { createCourse } from "@/modules/courses/application/create-course";
import { FakeCourseRepository } from "./fake-course-repository";

describe("createCourse", () => {
  it("creates a course owned by the given teacher", async () => {
    const courseRepository = new FakeCourseRepository();

    const result = await createCourse(
      { courseRepository },
      {
        title: "Intro to Python",
        description: null,
        sessionType: "ONLINE",
        paymentFrequency: "MONTHLY" as const,
  price: null,
        levelId: "level-1",
        teacherId: "teacher-1",
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ title: "Intro to Python", teacherId: "teacher-1" });
  });
});
