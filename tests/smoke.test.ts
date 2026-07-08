import { describe, it, expect } from "vitest";
import { cn } from "@/shared/lib/utils";

describe("project harness smoke test", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("can import project source via path alias and exercise it", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
