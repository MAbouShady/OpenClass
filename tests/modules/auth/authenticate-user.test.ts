import { describe, expect, it } from "vitest";
import { authenticateUser } from "@/modules/auth/application/authenticate-user";
import { InvalidCredentialsError } from "@/modules/auth/domain/errors";
import type { PasswordHasher } from "@/modules/auth/domain/password-hasher";
import type { UserWithCredentials } from "@/modules/auth/domain/user";
import { FakeUserRepository } from "./fake-user-repository";

const fakeHasher: PasswordHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (plain, hash) => hash === `hashed:${plain}`,
};

const existingUser: UserWithCredentials = {
  id: "user-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "TEACHER",
  bio: null,
  photoUrl: null,
  coverUrl: null,
  accentColor: null, paymentDetails: null,
  locale: "en",
  passwordHash: "hashed:password123",
};

describe("authenticateUser", () => {
  it("returns the user on correct credentials", async () => {
    const userRepository = new FakeUserRepository([existingUser]);
    const result = await authenticateUser(
      { userRepository, passwordHasher: fakeHasher },
      { email: "ada@example.com", password: "password123" },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.email).toBe("ada@example.com");
  });

  it("rejects an unknown email", async () => {
    const userRepository = new FakeUserRepository([]);
    const result = await authenticateUser(
      { userRepository, passwordHasher: fakeHasher },
      { email: "nobody@example.com", password: "password123" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidCredentialsError);
  });

  it("rejects an incorrect password", async () => {
    const userRepository = new FakeUserRepository([existingUser]);
    const result = await authenticateUser(
      { userRepository, passwordHasher: fakeHasher },
      { email: "ada@example.com", password: "wrong-password" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidCredentialsError);
  });
});
