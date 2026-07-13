import { describe, expect, it } from "vitest";
import { listCoursesForTeacher } from "@/modules/courses/application/list-courses-for-teacher";
import { FakeCourseRepository } from "./fake-course-repository";

describe("listCoursesForTeacher", () => {
  it("returns only courses owned by the given teacher", async () => {
    const courseRepository = new FakeCourseRepository([
      {
        id: "course-1",
        title: "A",
        description: null,
        sessionType: "ONLINE",
        paymentFrequency: "MONTHLY" as const,
  price: null,
        levelId: "level-1",
        teacherId: "teacher-1",
      },
      {
        id: "course-2",
        title: "B",
        description: null,
        sessionType: "OFFLINE",
        paymentFrequency: "MONTHLY" as const,
  price: null,
        levelId: "level-1",
        teacherId: "teacher-2",
      },
    ]);

    const courses = await listCoursesForTeacher({ courseRepository }, "teacher-1");

    expect(courses.map((course) => course.id)).toEqual(["course-1"]);
  });
});
