import { describe, it, expect } from "vitest";
import { ok, err } from "@/shared/domain/result";

describe("project harness smoke test", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("can import project source via path alias and exercise it", () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err("bad")).toEqual({ ok: false, error: "bad" });
  });
});
