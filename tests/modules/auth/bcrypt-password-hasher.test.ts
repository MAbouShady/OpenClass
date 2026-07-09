import { describe, expect, it } from "vitest";
import { BcryptPasswordHasher } from "@/modules/auth/infrastructure/bcrypt-password-hasher";

describe("BcryptPasswordHasher", () => {
  const hasher = new BcryptPasswordHasher();

  it("verifies a password against its own hash", async () => {
    const hash = await hasher.hash("correct-horse-battery-staple");
    await expect(hasher.verify("correct-horse-battery-staple", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hasher.hash("correct-horse-battery-staple");
    await expect(hasher.verify("wrong-password", hash)).resolves.toBe(false);
  });

  it("produces a different hash each time (salted)", async () => {
    const [a, b] = await Promise.all([hasher.hash("same-password"), hasher.hash("same-password")]);
    expect(a).not.toBe(b);
  });
});
