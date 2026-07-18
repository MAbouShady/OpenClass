import { describe, expect, it } from "vitest";
import { updateProfile } from "@/modules/auth/application/update-profile";
import type { UserWithCredentials } from "@/modules/auth/domain/user";
import { FakeUserRepository } from "./fake-user-repository";

const existingUser: UserWithCredentials = {
  id: "user-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "TEACHER",
  bio: null,
  photoUrl: null,
  coverUrl: null,
  coverOffsetY: 50,
  accentColor: null, paymentDetails: null,
  locale: "en",
  passwordHash: "hashed:whatever",
};

describe("updateProfile", () => {
  it("updates the name and bio", async () => {
    const userRepository = new FakeUserRepository([existingUser]);

    const updated = await updateProfile({ userRepository }, "user-1", {
      name: "Ada L.",
      bio: "Mathematician and writer.",
      photoUrl: null,
      coverUrl: null,
  coverOffsetY: 50,
      accentColor: null, paymentDetails: null,
      locale: "en" as const,
    });

    expect(updated.name).toBe("Ada L.");
    expect(updated.bio).toBe("Mathematician and writer.");
  });

  it("never returns the password hash", async () => {
    const userRepository = new FakeUserRepository([existingUser]);

    const updated = await updateProfile({ userRepository }, "user-1", {
      name: "Ada L.",
      bio: null,
      photoUrl: null,
      coverUrl: null,
  coverOffsetY: 50,
      accentColor: null, paymentDetails: null,
      locale: "en" as const,
    });

    expect(updated).not.toHaveProperty("passwordHash");
  });

  it("treats an empty bio as null", async () => {
    const userRepository = new FakeUserRepository([existingUser]);

    const updated = await updateProfile({ userRepository }, "user-1", {
      name: "Ada",
      bio: "",
      photoUrl: null,
      coverUrl: null,
  coverOffsetY: 50,
      accentColor: null, paymentDetails: null,
      locale: "en" as const,
    });

    expect(updated.bio).toBeNull();
  });
});
