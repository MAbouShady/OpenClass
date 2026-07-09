import { describe, expect, it } from "vitest";
import { deleteLevel } from "@/modules/levels/application/delete-level";
import { LevelNotFoundError } from "@/modules/levels/domain/errors";
import { FakeLevelRepository } from "./fake-level-repository";

describe("deleteLevel", () => {
  it("deletes an existing level", async () => {
    const levelRepository = new FakeLevelRepository([
      { id: "level-1", name: "Beginner", order: 1, description: null },
    ]);

    const result = await deleteLevel({ levelRepository }, { id: "level-1" });

    expect(result.ok).toBe(true);
    await expect(levelRepository.findById("level-1")).resolves.toBeNull();
  });

  it("rejects deleting a level that does not exist", async () => {
    const levelRepository = new FakeLevelRepository();

    const result = await deleteLevel({ levelRepository }, { id: "missing" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(LevelNotFoundError);
  });
});
