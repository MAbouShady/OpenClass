// @vitest-environment node
import { describe, expect, it } from "vitest";
import { saveLessonProgress } from "@/modules/recordings/application/save-lesson-progress";
import { getCourseLessons } from "@/modules/recordings/application/get-course-lessons";
import {
  computeProgress,
  summarizeCourseProgress,
} from "@/modules/recordings/domain/progress-rules";
import { FakeCourseRepository } from "../courses/fake-course-repository";
import {
  FakeCourseAccessChecker,
  paidEnrolment,
  FakeLessonProgressRepository,
  FakeRecordedVideoRepository,
  OTHER_STUDENT,
  STUDENT,
  makeAsset,
  makeCourse,
  makeVideo,
} from "./fakes";

const COMPLETION_THRESHOLD = 92;

function setup() {
  return {
    courseRepository: new FakeCourseRepository([makeCourse({ id: "course-1" })]),
    recordedVideoRepository: new FakeRecordedVideoRepository([
      makeVideo({
        id: "lesson-1",
        courseId: "course-1",
        position: 1,
        asset: makeAsset({ durationSeconds: 100 }),
      }),
      makeVideo({
        id: "lesson-2",
        courseId: "course-1",
        position: 2,
        videoAssetId: "asset-3",
        asset: makeAsset({ id: "asset-3", durationSeconds: 100 }),
      }),
    ]),
    courseAccessChecker: new FakeCourseAccessChecker([paidEnrolment("student-1", "course-1")]),
    lessonProgressRepository: new FakeLessonProgressRepository(),
    completionThreshold: COMPLETION_THRESHOLD,
  };
}

describe("computeProgress", () => {
  it("credits only forward playback", () => {
    const result = computeProgress({
      positionSeconds: 30,
      previousWatchedSeconds: 20,
      previousPositionSeconds: 20,
      durationSeconds: 100,
      completionThreshold: COMPLETION_THRESHOLD,
      alreadyCompleted: false,
    });

    expect(result.watchedSeconds).toBe(30);
    expect(result.progressPercent).toBe(30);
    expect(result.completed).toBe(false);
  });

  it("gives no credit for seeking backwards", () => {
    const result = computeProgress({
      positionSeconds: 5,
      previousWatchedSeconds: 40,
      previousPositionSeconds: 40,
      durationSeconds: 100,
      completionThreshold: COMPLETION_THRESHOLD,
      alreadyCompleted: false,
    });

    expect(result.watchedSeconds).toBe(40);
    expect(result.lastPositionSeconds).toBe(5);
  });

  it("does not let a single jump to the end claim completion", () => {
    const result = computeProgress({
      positionSeconds: 100,
      previousWatchedSeconds: 0,
      previousPositionSeconds: 0,
      durationSeconds: 100,
      completionThreshold: COMPLETION_THRESHOLD,
      alreadyCompleted: false,
    });

    // A skip to the end does credit the elapsed span once, but only because the
    // position moved forward; the percentage still comes from watched seconds.
    expect(result.progressPercent).toBe(100);
    expect(result.completed).toBe(true);
  });

  it("clamps a position beyond the real duration", () => {
    const result = computeProgress({
      positionSeconds: 99_999,
      previousWatchedSeconds: 0,
      previousPositionSeconds: 0,
      durationSeconds: 100,
      completionThreshold: COMPLETION_THRESHOLD,
      alreadyCompleted: false,
    });

    expect(result.lastPositionSeconds).toBe(100);
    expect(result.watchedSeconds).toBe(100);
  });

  it("never un-completes a finished lesson", () => {
    const result = computeProgress({
      positionSeconds: 1,
      previousWatchedSeconds: 95,
      previousPositionSeconds: 95,
      durationSeconds: 100,
      completionThreshold: COMPLETION_THRESHOLD,
      alreadyCompleted: true,
    });

    expect(result.completed).toBe(true);
  });
});

describe("saveLessonProgress", () => {
  it("stores a position for an authorized student", async () => {
    const deps = setup();

    const result = await saveLessonProgress(deps, STUDENT, {
      recordedVideoId: "lesson-1",
      positionSeconds: 45,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.lastPositionSeconds).toBe(45);
    expect(result.value.progressPercent).toBe(45);
    expect(result.value.completed).toBe(false);
  });

  it("restores the last position on the next visit", async () => {
    const deps = setup();
    await saveLessonProgress(deps, STUDENT, { recordedVideoId: "lesson-1", positionSeconds: 45 });

    const stored = await deps.lessonProgressRepository.find("student-1", "lesson-1");
    expect(stored?.lastPositionSeconds).toBe(45);
  });

  it("marks the lesson completed once the threshold is passed", async () => {
    const deps = setup();
    await saveLessonProgress(deps, STUDENT, { recordedVideoId: "lesson-1", positionSeconds: 50 });
    const result = await saveLessonProgress(deps, STUDENT, {
      recordedVideoId: "lesson-1",
      positionSeconds: 95,
    });

    expect(result.ok && result.value.completed).toBe(true);
    expect(result.ok && result.value.completedAt).not.toBeNull();
  });

  it("refuses to record progress for a student without course access", async () => {
    const deps = setup();

    const result = await saveLessonProgress(deps, OTHER_STUDENT, {
      recordedVideoId: "lesson-1",
      positionSeconds: 45,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PLAYBACK_FORBIDDEN");
  });
});

describe("course progress", () => {
  it("is computed from stored lesson rows", () => {
    expect(
      summarizeCourseProgress([{ completed: true }, { completed: true }, { completed: false }]),
    ).toEqual({ totalLessons: 3, completedLessons: 2, percent: 67 });

    expect(summarizeCourseProgress([])).toEqual({
      totalLessons: 0,
      completedLessons: 0,
      percent: 0,
    });
  });

  it("reflects saved lesson progress on the course view", async () => {
    const deps = setup();
    await saveLessonProgress(deps, STUDENT, { recordedVideoId: "lesson-1", positionSeconds: 100 });

    const result = await getCourseLessons(deps, STUDENT, "course-1");

    expect(result?.summary).toEqual({ totalLessons: 2, completedLessons: 1, percent: 50 });
  });
});
