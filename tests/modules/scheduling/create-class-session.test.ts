import { describe, expect, it } from "vitest";
import { createClassSession } from "@/modules/scheduling/application/create-class-session";
import { InvalidSessionTimeRangeError } from "@/modules/scheduling/domain/errors";
import { FakeClassSessionRepository } from "./fake-class-session-repository";

describe("createClassSession", () => {
  it("creates a session when end is after start", async () => {
    const classSessionRepository = new FakeClassSessionRepository();

    const result = await createClassSession(
      { classSessionRepository },
      {
        courseId: "course-1",
        startTime: new Date("2026-01-01T10:00:00Z"),
        endTime: new Date("2026-01-01T11:00:00Z"),
      },
    );

    expect(result.ok).toBe(true);
  });

  it("rejects when end is not after start", async () => {
    const classSessionRepository = new FakeClassSessionRepository();

    const result = await createClassSession(
      { classSessionRepository },
      {
        courseId: "course-1",
        startTime: new Date("2026-01-01T11:00:00Z"),
        endTime: new Date("2026-01-01T10:00:00Z"),
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidSessionTimeRangeError);
  });
});
