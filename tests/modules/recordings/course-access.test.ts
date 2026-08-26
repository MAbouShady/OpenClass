// @vitest-environment node
import { describe, expect, it } from "vitest";
import { decideCourseAccess, isPeriodPaid } from "@/modules/recordings/domain/course-access-rules";
import { normalizeToMonthStart } from "@/modules/payments/domain/month";
import { authorizePlayback } from "@/modules/recordings/application/authorize-playback";
import { getCourseLessons } from "@/modules/recordings/application/get-course-lessons";
import { listStudentCourses } from "@/modules/recordings/application/list-student-courses";
import { FakeCourseRepository } from "../courses/fake-course-repository";
import {
  FakeCourseAccessChecker,
  FakeLessonProgressRepository,
  FakeRecordedVideoRepository,
  STUDENT,
  TEACHER,
  makeCourse,
  makeVideo,
  paidEnrolment,
  type SeededEnrolment,
} from "./fakes";

const MARCH = new Date("2026-03-15T10:00:00Z");
const MARCH_MONTH = normalizeToMonthStart(MARCH);
const FEBRUARY_MONTH = normalizeToMonthStart(new Date("2026-02-10T00:00:00Z"));
const APRIL = new Date("2026-04-02T10:00:00Z");

const STARTED = new Date("2026-01-01T00:00:00Z");

function facts(overrides: Partial<SeededEnrolment> = {}) {
  return [
    {
      enrollmentId: "enr-1",
      semesterId: "sem-1",
      semesterStartDate: overrides.semesterStartDate ?? STARTED,
      paymentFrequency: overrides.paymentFrequency ?? ("MONTHLY" as const),
      approvedMonths: overrides.approvedMonths ?? [],
    },
  ];
}

describe("decideCourseAccess", () => {
  it("refuses a student with no enrolment at all", () => {
    expect(decideCourseAccess([], MARCH)).toMatchObject({
      granted: false,
      reason: "NOT_ENROLLED",
    });
  });

  it("refuses an enrolled student who has never paid", () => {
    // The reported bug: registering was enough to watch.
    expect(decideCourseAccess(facts(), MARCH)).toMatchObject({
      granted: false,
      reason: "PAYMENT_REQUIRED",
      owedMonth: MARCH_MONTH,
    });
  });

  it("grants access when the current month is paid", () => {
    expect(decideCourseAccess(facts({ approvedMonths: [MARCH_MONTH] }), MARCH)).toMatchObject({
      granted: true,
    });
  });

  it("refuses when only a previous month was paid", () => {
    // A recurring course must be paid every month; February buys February.
    expect(decideCourseAccess(facts({ approvedMonths: [FEBRUARY_MONTH] }), MARCH)).toMatchObject({
      granted: false,
      reason: "PAYMENT_REQUIRED",
    });
  });

  it("revokes access the moment a new unpaid month begins", () => {
    const paidForMarch = facts({ approvedMonths: [MARCH_MONTH] });

    expect(decideCourseAccess(paidForMarch, MARCH).granted).toBe(true);
    expect(decideCourseAccess(paidForMarch, APRIL).granted).toBe(false);
  });

  it("refuses a course that starts next month, even when already paid", () => {
    const result = decideCourseAccess(
      facts({
        semesterStartDate: new Date("2026-04-01T00:00:00Z"),
        approvedMonths: [MARCH_MONTH],
      }),
      MARCH,
    );

    expect(result).toMatchObject({ granted: false, reason: "NOT_STARTED" });
    if (result.granted) return;
    expect(result.startsAt).toEqual(new Date("2026-04-01T00:00:00Z"));
  });

  it("refuses a course that starts in three months", () => {
    expect(
      decideCourseAccess(
        facts({
          semesterStartDate: new Date("2026-06-01T00:00:00Z"),
          approvedMonths: [MARCH_MONTH],
        }),
        MARCH,
      ),
    ).toMatchObject({ granted: false, reason: "NOT_STARTED" });
  });

  it("opens exactly on the start date, not before", () => {
    const startsAt = new Date("2026-03-15T10:00:00Z");
    const seeded = facts({ semesterStartDate: startsAt, approvedMonths: [MARCH_MONTH] });

    expect(decideCourseAccess(seeded, new Date(startsAt.getTime() - 1)).granted).toBe(false);
    expect(decideCourseAccess(seeded, startsAt).granted).toBe(true);
  });

  it("treats a one-time course as paid by any approved payment", () => {
    expect(
      decideCourseAccess(
        facts({ paymentFrequency: "ONE_TIME", approvedMonths: [FEBRUARY_MONTH] }),
        MARCH,
      ).granted,
    ).toBe(true);
  });

  it("treats a per-semester course as paid by any approved payment", () => {
    expect(
      decideCourseAccess(
        facts({ paymentFrequency: "PER_SEMESTER", approvedMonths: [FEBRUARY_MONTH] }),
        MARCH,
      ).granted,
    ).toBe(true);
  });

  it("grants when any one of several enrolments qualifies", () => {
    const result = decideCourseAccess(
      [
        { ...facts()[0]!, enrollmentId: "old", approvedMonths: [FEBRUARY_MONTH] },
        { ...facts()[0]!, enrollmentId: "current", approvedMonths: [MARCH_MONTH] },
      ],
      MARCH,
    );

    expect(result).toMatchObject({ granted: true, enrollmentId: "current" });
  });
});

describe("isPeriodPaid", () => {
  // Shared with the course cards' paid-students count, so the number a teacher
  // sees can never disagree with who can actually watch.
  it("requires the current month on a recurring course", () => {
    expect(isPeriodPaid(facts({ approvedMonths: [MARCH_MONTH] })[0]!, MARCH)).toBe(true);
    expect(isPeriodPaid(facts({ approvedMonths: [FEBRUARY_MONTH] })[0]!, MARCH)).toBe(false);
    expect(isPeriodPaid(facts()[0]!, MARCH)).toBe(false);
  });

  it("accepts any approved payment on one-time and per-semester courses", () => {
    for (const paymentFrequency of ["ONE_TIME", "PER_SEMESTER"] as const) {
      expect(
        isPeriodPaid(facts({ paymentFrequency, approvedMonths: [FEBRUARY_MONTH] })[0]!, MARCH),
      ).toBe(true);
      expect(isPeriodPaid(facts({ paymentFrequency })[0]!, MARCH)).toBe(false);
    }
  });

  it("ignores the start date — an early payer has still paid", () => {
    const notStarted = facts({
      semesterStartDate: new Date("2026-06-01T00:00:00Z"),
      approvedMonths: [MARCH_MONTH],
    })[0]!;

    expect(isPeriodPaid(notStarted, MARCH)).toBe(true);
    // ...but they still cannot watch until the course opens.
    expect(decideCourseAccess([notStarted], MARCH).granted).toBe(false);
  });
});

describe("authorizePlayback with payment gating", () => {
  function setup(enrolments: readonly SeededEnrolment[]) {
    return {
      courseRepository: new FakeCourseRepository([makeCourse({ id: "course-1" })]),
      recordedVideoRepository: new FakeRecordedVideoRepository([
        makeVideo({ id: "lesson-1", courseId: "course-1" }),
      ]),
      courseAccessChecker: new FakeCourseAccessChecker(enrolments),
      lessonProgressRepository: new FakeLessonProgressRepository(),
    };
  }

  it("refuses playback for an enrolled but unpaid student", async () => {
    const result = await authorizePlayback(
      setup([{ studentId: "student-1", courseId: "course-1", semesterStartDate: STARTED }]),
      STUDENT,
      "lesson-1",
      MARCH,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("COURSE_PAYMENT_REQUIRED");
  });

  it("allows playback once the current month is paid", async () => {
    const result = await authorizePlayback(
      setup([paidEnrolment("student-1", "course-1", MARCH)]),
      STUDENT,
      "lesson-1",
      MARCH,
    );

    expect(result.ok).toBe(true);
  });

  it("stops playback again the following month", async () => {
    const deps = setup([paidEnrolment("student-1", "course-1", MARCH)]);

    expect((await authorizePlayback(deps, STUDENT, "lesson-1", MARCH)).ok).toBe(true);
    expect((await authorizePlayback(deps, STUDENT, "lesson-1", APRIL)).ok).toBe(false);
  });

  it("refuses playback before the course starts", async () => {
    const result = await authorizePlayback(
      setup([
        paidEnrolment("student-1", "course-1", MARCH, {
          semesterStartDate: new Date("2026-05-01T00:00:00Z"),
        }),
      ]),
      STUDENT,
      "lesson-1",
      MARCH,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("COURSE_NOT_STARTED");
  });

  it("still lets the owning teacher preview without any payment", async () => {
    const result = await authorizePlayback(setup([]), TEACHER, "lesson-1", MARCH);
    expect(result.ok).toBe(true);
  });
});

describe("course listing with payment gating", () => {
  function setup(enrolments: readonly SeededEnrolment[]) {
    return {
      courseRepository: new FakeCourseRepository([makeCourse({ id: "course-1" })]),
      recordedVideoRepository: new FakeRecordedVideoRepository([
        makeVideo({ id: "lesson-1", courseId: "course-1" }),
      ]),
      courseAccessChecker: new FakeCourseAccessChecker(enrolments),
      lessonProgressRepository: new FakeLessonProgressRepository(),
    };
  }

  it("still lists an unpaid course, marked locked, so the student knows why", async () => {
    const courses = await listStudentCourses(
      setup([{ studentId: "student-1", courseId: "course-1" }]),
      "student-1",
      MARCH,
    );

    expect(courses).toHaveLength(1);
    expect(courses[0]?.access).toMatchObject({ granted: false, reason: "PAYMENT_REQUIRED" });
  });

  it("gives the lesson list but withholds access for an unpaid student", async () => {
    const result = await getCourseLessons(
      setup([{ studentId: "student-1", courseId: "course-1" }]),
      STUDENT,
      "course-1",
      MARCH,
    );

    expect(result?.lessons).toHaveLength(1);
    expect(result?.access.granted).toBe(false);
  });

  it("reveals nothing at all to someone with no enrolment", async () => {
    expect(await getCourseLessons(setup([]), STUDENT, "course-1", MARCH)).toBeNull();
  });
});
