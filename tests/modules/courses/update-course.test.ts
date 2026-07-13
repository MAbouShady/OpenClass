import { describe, expect, it } from "vitest";
import { updateCourse } from "@/modules/courses/application/update-course";
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

describe("updateCourse", () => {
  it("allows the owning teacher to update their course", async () => {
    const courseRepository = new FakeCourseRepository([...SEED]);

    const result = await updateCourse(
      { courseRepository },
      { userId: "teacher-1", isAdmin: false },
      {
        id: "course-1",
        title: "Advanced Python",
        description: null,
        sessionType: "OFFLINE",
        paymentFrequency: "MONTHLY" as const,
  price: null,
        levelId: "level-2",
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.title).toBe("Advanced Python");
  });

  it("allows an admin to update any course", async () => {
    const courseRepository = new FakeCourseRepository([...SEED]);

    const result = await updateCourse(
      { courseRepository },
      { userId: "admin-1", isAdmin: true },
      {
        id: "course-1",
        title: "Renamed",
        description: null,
        sessionType: "ONLINE",
        paymentFrequency: "MONTHLY" as const,
  price: null,
        levelId: "level-1",
      },
    );

    expect(result.ok).toBe(true);
  });

  it("rejects a teacher updating another teacher's course", async () => {
    const courseRepository = new FakeCourseRepository([...SEED]);

    const result = await updateCourse(
      { courseRepository },
      { userId: "teacher-2", isAdmin: false },
      {
        id: "course-1",
        title: "Hijacked",
        description: null,
        sessionType: "ONLINE",
        paymentFrequency: "MONTHLY" as const,
  price: null,
        levelId: "level-1",
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(CourseForbiddenError);
  });

  it("rejects updating a course that does not exist", async () => {
    const courseRepository = new FakeCourseRepository();

    const result = await updateCourse(
      { courseRepository },
      { userId: "teacher-1", isAdmin: false },
      {
        id: "missing",
        title: "Missing",
        description: null,
        sessionType: "ONLINE",
        paymentFrequency: "MONTHLY" as const,
  price: null,
        levelId: "level-1",
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(CourseNotFoundError);
  });
});
