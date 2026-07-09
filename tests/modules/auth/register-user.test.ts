import { describe, expect, it } from "vitest";
import { registerUser } from "@/modules/auth/application/register-user";
import { EmailAlreadyTakenError } from "@/modules/auth/domain/errors";
import type { PasswordHasher } from "@/modules/auth/domain/password-hasher";
import { FakeUserRepository } from "./fake-user-repository";

const fakeHasher: PasswordHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (plain, hash) => hash === `hashed:${plain}`,
};

describe("registerUser", () => {
  it("creates a user and never returns the password hash", async () => {
    const userRepository = new FakeUserRepository();
    const result = await registerUser(
      { userRepository, passwordHasher: fakeHasher },
      {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "password123",
        role: "TEACHER",
        locale: "en",
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      id: "user-1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      role: "TEACHER",
      bio: null,
      locale: "en",
    });
    expect(result.value).not.toHaveProperty("passwordHash");
  });

  it("stores the hashed password, not the plain one", async () => {
    const userRepository = new FakeUserRepository();
    await registerUser(
      { userRepository, passwordHasher: fakeHasher },
      {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "password123",
        role: "TEACHER",
        locale: "en",
      },
    );

    const stored = await userRepository.findByEmail("ada@example.com");
    expect(stored?.passwordHash).toBe("hashed:password123");
  });

  it("rejects registration when the email is already taken", async () => {
    const userRepository = new FakeUserRepository([
      {
        id: "existing-1",
        name: "Existing",
        email: "ada@example.com",
        role: "TEACHER",
        bio: null,
        locale: "en",
        passwordHash: "hashed:whatever",
      },
    ]);

    const result = await registerUser(
      { userRepository, passwordHasher: fakeHasher },
      {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "password123",
        role: "TEACHER",
        locale: "en",
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(EmailAlreadyTakenError);
  });
});
