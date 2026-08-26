// @vitest-environment node
import { describe, expect, it } from "vitest";
import { authorizePlayback } from "@/modules/recordings/application/authorize-playback";
import { getCourseLessons } from "@/modules/recordings/application/get-course-lessons";
import { FakeCourseRepository } from "../courses/fake-course-repository";
import {
  ADMIN,
  FakeCourseAccessChecker,
  paidEnrolment,
  FakeLessonProgressRepository,
  FakeRecordedVideoRepository,
  OTHER_STUDENT,
  STUDENT,
  TEACHER,
  makeAsset,
  makeCourse,
  makeVideo,
} from "./fakes";

function setup() {
  const courseRepository = new FakeCourseRepository([
    makeCourse({ id: "course-1", teacherId: "teacher-1" }),
    makeCourse({ id: "course-2", title: "Other", teacherId: "teacher-1" }),
    makeCourse({ id: "course-hidden", title: "Retired", teacherId: "teacher-1", isActive: false }),
  ]);
  const recordedVideoRepository = new FakeRecordedVideoRepository([
    makeVideo({ id: "published", courseId: "course-1", position: 1 }),
    makeVideo({ id: "draft", courseId: "course-1", position: 2, status: "DRAFT" }),
    makeVideo({
      id: "unprocessed",
      courseId: "course-1",
      position: 3,
      asset: makeAsset({ id: "asset-2", processingStatus: "PROCESSING", hlsPrefix: null }),
      videoAssetId: "asset-2",
    }),
    makeVideo({ id: "other-course", courseId: "course-2", position: 1 }),
    makeVideo({ id: "hidden-course", courseId: "course-hidden", position: 1 }),
  ]);
  // The student is enrolled in course-1 only.
  const courseAccessChecker = new FakeCourseAccessChecker([
    paidEnrolment("student-1", "course-1"),
    paidEnrolment("student-1", "course-hidden"),
  ]);
  const lessonProgressRepository = new FakeLessonProgressRepository();
  return {
    courseRepository,
    recordedVideoRepository,
    courseAccessChecker,
    lessonProgressRepository,
  };
}

describe("authorizePlayback", () => {
  it("authorizes an enrolled student for a published, processed lesson", async () => {
    const result = await authorizePlayback(setup(), STUDENT, "published");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.courseId).toBe("course-1");
    expect(result.value.asset.id).toBe("asset-1");
  });

  it("refuses a student who is not enrolled in the course", async () => {
    const result = await authorizePlayback(setup(), OTHER_STUDENT, "published");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PLAYBACK_FORBIDDEN");
  });

  it("refuses a lesson from a course the student is not enrolled in, even by direct id", async () => {
    const result = await authorizePlayback(setup(), STUDENT, "other-course");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PLAYBACK_FORBIDDEN");
  });

  it("refuses an unpublished lesson", async () => {
    const result = await authorizePlayback(setup(), STUDENT, "draft");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PLAYBACK_FORBIDDEN");
  });

  it("refuses a lesson whose course is not available", async () => {
    const result = await authorizePlayback(setup(), STUDENT, "hidden-course");

    expect(result.ok).toBe(false);
  });

  it("refuses a lesson that has not finished processing", async () => {
    const result = await authorizePlayback(setup(), STUDENT, "unprocessed");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("VIDEO_NOT_PROCESSED");
  });

  it("reports a missing lesson without leaking anything else", async () => {
    const result = await authorizePlayback(setup(), STUDENT, "does-not-exist");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("RECORDED_VIDEO_NOT_FOUND");
  });

  it("lets the owning teacher preview an unpublished lesson", async () => {
    const result = await authorizePlayback(setup(), TEACHER, "draft");
    expect(result.ok).toBe(true);
  });

  it("lets an admin preview any lesson", async () => {
    const result = await authorizePlayback(setup(), ADMIN, "draft");
    expect(result.ok).toBe(true);
  });
});

describe("getCourseLessons", () => {
  it("gives an enrolled student only the published lessons, in stored order", async () => {
    const result = await getCourseLessons(setup(), STUDENT, "course-1");

    expect(result).not.toBeNull();
    expect(result?.lessons.map((lesson) => lesson.video.id)).toEqual(["published", "unprocessed"]);
    expect(result?.canManage).toBe(false);
  });

  it("gives a course manager the drafts too", async () => {
    const result = await getCourseLessons(setup(), TEACHER, "course-1");

    expect(result?.lessons.map((lesson) => lesson.video.id)).toEqual([
      "published",
      "draft",
      "unprocessed",
    ]);
    expect(result?.canManage).toBe(true);
  });

  it("returns nothing for a course the student is not enrolled in", async () => {
    expect(await getCourseLessons(setup(), STUDENT, "course-2")).toBeNull();
  });

  it("returns nothing for an unavailable course", async () => {
    expect(await getCourseLessons(setup(), STUDENT, "course-hidden")).toBeNull();
  });
});
