// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  createStudentPortalSession,
  verifyStudentPortalSession,
} from "@/modules/recordings/domain/student-portal-session";
import {
  verifyPlaybackToken,
  generatePlaybackToken,
} from "@/modules/recordings/domain/playback-token";
import { authenticateStudentByCode } from "@/modules/recordings/application/authenticate-student-by-code";
import { listStudentCourses } from "@/modules/recordings/application/list-student-courses";
import type {
  PortalStudent,
  StudentDirectory,
} from "@/modules/recordings/domain/student-directory";
import { FakeCourseRepository } from "../courses/fake-course-repository";
import {
  FakeCourseAccessChecker,
  paidEnrolment,
  FakeLessonProgressRepository,
  FakeRecordedVideoRepository,
  makeAsset,
  makeCourse,
  makeVideo,
} from "./fakes";

class FakeStudentDirectory implements StudentDirectory {
  constructor(private readonly students: readonly PortalStudent[]) {}

  async findByCode(code: number): Promise<PortalStudent | null> {
    return this.students.find((student) => student.code === code) ?? null;
  }

  async findById(id: string): Promise<PortalStudent | null> {
    return this.students.find((student) => student.id === id) ?? null;
  }
}

const STUDENTS = [{ id: "student-1", name: "QA Student", code: 900001 }];

describe("student portal session", () => {
  it("round-trips a student id", () => {
    const { value } = createStudentPortalSession("student-1");
    expect(verifyStudentPortalSession(value)?.s).toBe("student-1");
  });

  it("rejects a tampered value", () => {
    const { value } = createStudentPortalSession("student-1");
    const [encoded] = value.split(".");
    expect(verifyStudentPortalSession(`${encoded}.deadbeef`)).toBeNull();
  });

  it("rejects a re-pointed payload carrying someone else's signature", () => {
    const { value } = createStudentPortalSession("student-1");
    const [, signature] = value.split(".");
    const forged = Buffer.from(
      JSON.stringify({ s: "student-999", e: 9_999_999_999 }),
      "utf8",
    ).toString("base64url");
    expect(verifyStudentPortalSession(`${forged}.${signature}`)).toBeNull();
  });

  it("expires", () => {
    const issuedAt = new Date("2026-01-01T00:00:00Z");
    const { value } = createStudentPortalSession("student-1", 60, issuedAt);

    expect(verifyStudentPortalSession(value, new Date(issuedAt.getTime() + 59_000))).not.toBeNull();
    expect(verifyStudentPortalSession(value, new Date(issuedAt.getTime() + 61_000))).toBeNull();
  });

  it("rejects a missing or malformed cookie", () => {
    expect(verifyStudentPortalSession(undefined)).toBeNull();
    expect(verifyStudentPortalSession("")).toBeNull();
    expect(verifyStudentPortalSession("nonsense")).toBeNull();
  });

  it("cannot be replayed as a playback token, or vice versa", () => {
    // The two token kinds are signed in different contexts, so neither is
    // accepted where the other belongs.
    const portal = createStudentPortalSession("student-1").value;
    expect(verifyPlaybackToken(portal)).toBeNull();

    const playback = generatePlaybackToken({ a: "asset-1", v: "video-1", u: "student-1" }).token;
    expect(verifyStudentPortalSession(playback)).toBeNull();
  });
});

describe("authenticateStudentByCode", () => {
  const deps = { studentDirectory: new FakeStudentDirectory(STUDENTS) };

  it("resolves a student from their code number", async () => {
    const result = await authenticateStudentByCode(deps, { code: "900001" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe("student-1");
  });

  it("refuses an unknown code", async () => {
    const result = await authenticateStudentByCode(deps, { code: 123456 });
    expect(result.ok).toBe(false);
  });

  it("refuses malformed codes without throwing", async () => {
    for (const code of ["", "abc", "-5", "0", "1e999", null, undefined]) {
      const result = await authenticateStudentByCode(deps, { code } as never);
      expect(result.ok).toBe(false);
    }
  });

  it("gives the same message whether the code is unknown or malformed", async () => {
    const unknown = await authenticateStudentByCode(deps, { code: 123456 });
    const malformed = await authenticateStudentByCode(deps, { code: "abc" });

    // Identical wording, so the form cannot be used to probe which codes exist.
    expect(unknown.ok).toBe(false);
    expect(malformed.ok).toBe(false);
    if (unknown.ok || malformed.ok) return;
    expect(unknown.error.message).toBe(malformed.error.message);
  });
});

describe("listStudentCourses", () => {
  function setup() {
    return {
      courseRepository: new FakeCourseRepository([
        makeCourse({ id: "course-1" }),
        makeCourse({ id: "course-2", title: "No lessons" }),
        makeCourse({ id: "course-off", title: "Retired", isActive: false }),
        makeCourse({ id: "course-other", title: "Not enrolled" }),
      ]),
      recordedVideoRepository: new FakeRecordedVideoRepository([
        makeVideo({ id: "v1", courseId: "course-1", position: 1 }),
        makeVideo({ id: "v2", courseId: "course-1", position: 2, status: "DRAFT" }),
        makeVideo({ id: "v-off", courseId: "course-off", position: 1 }),
        makeVideo({ id: "v-other", courseId: "course-other", position: 1 }),
      ]),
      lessonProgressRepository: new FakeLessonProgressRepository(),
      courseAccessChecker: new FakeCourseAccessChecker([
        paidEnrolment("student-1", "course-1"),
        paidEnrolment("student-1", "course-2"),
        paidEnrolment("student-1", "course-off"),
      ]),
    };
  }

  it("lists only enrolled, available courses that have published lessons", async () => {
    const result = await listStudentCourses(setup(), "student-1");

    expect(result.map((entry) => entry.course.id)).toEqual(["course-1"]);
    // Drafts are not counted toward what the student can watch.
    expect(result[0]?.lessonCount).toBe(1);
    expect(result[0]?.summary).toEqual({
      totalLessons: 1,
      completedLessons: 0,
      percent: 0,
    });
  });

  it("returns nothing for a student with no enrolments", async () => {
    expect(await listStudentCourses(setup(), "student-nobody")).toEqual([]);
  });

  it("reflects completion in the course summary", async () => {
    const deps = setup();
    await deps.lessonProgressRepository.upsert({
      userId: "student-1",
      recordedVideoId: "v1",
      watchedSeconds: 600,
      lastPositionSeconds: 600,
      progressPercent: 100,
      completed: true,
      completedAt: new Date(),
    });

    const result = await listStudentCourses(deps, "student-1");
    expect(result[0]?.summary.percent).toBe(100);
  });
});
