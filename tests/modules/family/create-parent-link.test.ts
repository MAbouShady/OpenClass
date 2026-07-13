import { describe, expect, it } from "vitest";
import { createParentLink } from "@/modules/family/application/create-parent-link";
import {
  ParentLinkAlreadyExistsError,
  UserNotFoundError,
  WrongRoleError,
} from "@/modules/family/domain/errors";
import { FakeUserRepository } from "../auth/fake-user-repository";
import { FakeParentLinkRepository } from "./fake-parent-link-repository";

const PARENT = {
  id: "parent-1",
  name: "Parent One",
  email: "parent@example.com",
  role: "PARENT" as const,
  bio: null,
  photoUrl: null,
  coverUrl: null,
  accentColor: null, paymentDetails: null,
  locale: "en",
  passwordHash: "hashed",
};

const STUDENT = {
  id: "student-1",
  name: "Student One",
  email: "student@example.com",
  role: "STUDENT" as const,
  bio: null,
  photoUrl: null,
  coverUrl: null,
  accentColor: null, paymentDetails: null,
  locale: "en",
  passwordHash: "hashed",
};

const TEACHER = {
  ...PARENT,
  id: "teacher-1",
  email: "teacher@example.com",
  role: "TEACHER" as const,
};

describe("createParentLink", () => {
  it("links a parent to a student", async () => {
    const userRepository = new FakeUserRepository([PARENT, STUDENT]);
    const parentLinkRepository = new FakeParentLinkRepository();

    const result = await createParentLink(
      { parentLinkRepository, userRepository },
      { parentEmail: "parent@example.com", studentEmail: "student@example.com" },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ parentId: "parent-1", studentId: "student-1" });
  });

  it("rejects an unknown parent email", async () => {
    const userRepository = new FakeUserRepository([STUDENT]);
    const parentLinkRepository = new FakeParentLinkRepository();

    const result = await createParentLink(
      { parentLinkRepository, userRepository },
      { parentEmail: "missing@example.com", studentEmail: "student@example.com" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(UserNotFoundError);
  });

  it("rejects when the parent email belongs to a non-parent user", async () => {
    const userRepository = new FakeUserRepository([TEACHER, STUDENT]);
    const parentLinkRepository = new FakeParentLinkRepository();

    const result = await createParentLink(
      { parentLinkRepository, userRepository },
      { parentEmail: "teacher@example.com", studentEmail: "student@example.com" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(WrongRoleError);
  });

  it("rejects when the student email belongs to a non-student user", async () => {
    const userRepository = new FakeUserRepository([PARENT, TEACHER]);
    const parentLinkRepository = new FakeParentLinkRepository();

    const result = await createParentLink(
      { parentLinkRepository, userRepository },
      { parentEmail: "parent@example.com", studentEmail: "teacher@example.com" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(WrongRoleError);
  });

  it("rejects a duplicate link", async () => {
    const userRepository = new FakeUserRepository([PARENT, STUDENT]);
    const parentLinkRepository = new FakeParentLinkRepository([
      { id: "link-1", parentId: "parent-1", studentId: "student-1" },
    ]);

    const result = await createParentLink(
      { parentLinkRepository, userRepository },
      { parentEmail: "parent@example.com", studentEmail: "student@example.com" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(ParentLinkAlreadyExistsError);
  });
});
