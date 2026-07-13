import { describe, expect, it } from "vitest";
import { updateLevel } from "@/modules/levels/application/update-level";
import { LevelNameTakenError, LevelNotFoundError } from "@/modules/levels/domain/errors";
import { FakeLevelRepository } from "./fake-level-repository";

describe("updateLevel", () => {
  it("updates a level's fields", async () => {
    const levelRepository = new FakeLevelRepository([
      { id: "level-1", name: "Beginner", order: 1, description: null, parentLevelId: null, teacherId: null },
    ]);

    const result = await updateLevel(
      { levelRepository },
      { id: "level-1", name: "Beginner", order: 2, description: "Updated" },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ order: 2, description: "Updated" });
  });

  it("rejects when the level does not exist", async () => {
    const levelRepository = new FakeLevelRepository();

    const result = await updateLevel(
      { levelRepository },
      { id: "missing", name: "Beginner", order: 1, description: null },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(LevelNotFoundError);
  });

  it("rejects renaming to a name already used by another level", async () => {
    const levelRepository = new FakeLevelRepository([
      { id: "level-1", name: "Beginner", order: 1, description: null, parentLevelId: null, teacherId: null },
      { id: "level-2", name: "Advanced", order: 2, description: null, parentLevelId: null, teacherId: null },
    ]);

    const result = await updateLevel(
      { levelRepository },
      { id: "level-2", name: "Beginner", order: 2, description: null },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(LevelNameTakenError);
  });

  it("allows keeping the same name on the same level", async () => {
    const levelRepository = new FakeLevelRepository([
      { id: "level-1", name: "Beginner", order: 1, description: null, parentLevelId: null, teacherId: null },
    ]);

    const result = await updateLevel(
      { levelRepository },
      { id: "level-1", name: "Beginner", order: 5, description: null },
    );

    expect(result.ok).toBe(true);
  });
});
