import { describe, expect, it } from "vitest";
import { deleteClassSession } from "@/modules/scheduling/application/delete-class-session";
import { ClassSessionNotFoundError } from "@/modules/scheduling/domain/errors";
import { FakeClassSessionRepository } from "./fake-class-session-repository";

describe("deleteClassSession", () => {
  it("deletes an existing session", async () => {
    const classSessionRepository = new FakeClassSessionRepository([
      {
        id: "session-1",
        courseId: "course-1",
        startTime: new Date("2026-01-01T10:00:00Z"),
        endTime: new Date("2026-01-01T11:00:00Z"),
      },
    ]);

    const result = await deleteClassSession({ classSessionRepository }, { id: "session-1" });

    expect(result.ok).toBe(true);
    await expect(classSessionRepository.findById("session-1")).resolves.toBeNull();
  });

  it("rejects deleting a session that does not exist", async () => {
    const classSessionRepository = new FakeClassSessionRepository();

    const result = await deleteClassSession({ classSessionRepository }, { id: "missing" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(ClassSessionNotFoundError);
  });
});
