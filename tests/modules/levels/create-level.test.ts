import { describe, expect, it } from "vitest";
import { createLevel } from "@/modules/levels/application/create-level";
import { LevelNameTakenError } from "@/modules/levels/domain/errors";
import { FakeLevelRepository } from "./fake-level-repository";

describe("createLevel", () => {
  it("creates a level", async () => {
    const levelRepository = new FakeLevelRepository();
    const result = await createLevel(
      { levelRepository },
      { name: "Beginner", order: 1, description: "Just starting out" },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ name: "Beginner", order: 1 });
  });

  it("rejects a duplicate name", async () => {
    const levelRepository = new FakeLevelRepository([
      { id: "level-1", name: "Beginner", order: 1, description: null },
    ]);

    const result = await createLevel(
      { levelRepository },
      { name: "Beginner", order: 2, description: null },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(LevelNameTakenError);
  });
});
