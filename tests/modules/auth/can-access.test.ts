import { describe, expect, it } from "vitest";
import { canAccess } from "@/modules/auth/application/can-access";

describe("canAccess", () => {
  it("allows a role present in the allowed list", () => {
    expect(canAccess("TEACHER", ["ADMIN", "TEACHER"])).toBe(true);
  });

  it("denies a role not present in the allowed list", () => {
    expect(canAccess("STUDENT", ["ADMIN", "TEACHER"])).toBe(false);
  });

  it("denies when no role is provided", () => {
    expect(canAccess(undefined, ["ADMIN"])).toBe(false);
  });
});
