import { describe, expect, it } from "vitest";
import { listClassSessionsForCourse } from "@/modules/scheduling/application/list-class-sessions-for-course";
import { FakeClassSessionRepository } from "./fake-class-session-repository";

describe("listClassSessionsForCourse", () => {
  it("returns only sessions for the given course", async () => {
    const classSessionRepository = new FakeClassSessionRepository([
      {
        id: "session-1",
        courseId: "course-1",
        startTime: new Date("2026-01-01T10:00:00Z"),
        endTime: new Date("2026-01-01T11:00:00Z"),
      },
      {
        id: "session-2",
        courseId: "course-2",
        startTime: new Date("2026-01-02T10:00:00Z"),
        endTime: new Date("2026-01-02T11:00:00Z"),
      },
    ]);

    const sessions = await listClassSessionsForCourse({ classSessionRepository }, "course-1");

    expect(sessions.map((session) => session.id)).toEqual(["session-1"]);
  });
});
