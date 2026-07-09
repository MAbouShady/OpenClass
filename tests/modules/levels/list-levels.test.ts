import { describe, expect, it } from "vitest";
import { listLevels } from "@/modules/levels/application/list-levels";
import { FakeLevelRepository } from "./fake-level-repository";

describe("listLevels", () => {
  it("returns levels ordered by their order field", async () => {
    const levelRepository = new FakeLevelRepository([
      { id: "level-2", name: "Advanced", order: 3, description: null },
      { id: "level-1", name: "Beginner", order: 1, description: null },
      { id: "level-3", name: "Intermediate", order: 2, description: null },
    ]);

    const levels = await listLevels({ levelRepository });

    expect(levels.map((level) => level.name)).toEqual(["Beginner", "Intermediate", "Advanced"]);
  });
});
