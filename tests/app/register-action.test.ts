import { beforeEach, describe, expect, it, vi } from "vitest";

const envMock = { REGISTRATION_ENABLED: false };
const registerUserMock = vi.fn();

vi.mock("@/shared/config/env", () => ({
  get env() {
    return envMock;
  },
}));
vi.mock("@/modules/auth/application/register-user", () => ({ registerUser: registerUserMock }));
vi.mock("@/modules/auth/infrastructure/prisma-user-repository", () => ({
  PrismaUserRepository: class {},
}));
vi.mock("@/modules/auth/infrastructure/bcrypt-password-hasher", () => ({
  BcryptPasswordHasher: class {},
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

const { registerAction } = await import("@/app/register/actions");

function validForm(): FormData {
  const formData = new FormData();
  formData.set("name", "Ada Lovelace");
  formData.set("email", "ada@example.com");
  formData.set("password", "password123");
  formData.set("role", "TEACHER");
  return formData;
}

describe("registerAction", () => {
  beforeEach(() => {
    registerUserMock.mockReset();
    envMock.REGISTRATION_ENABLED = false;
  });

  it("refuses a direct POST when registration is disabled", async () => {
    const result = await registerAction({}, validForm());

    expect(result.error).toBe("Registration is disabled.");
    expect(registerUserMock).not.toHaveBeenCalled();
  });

  it("refuses before parsing input, so no error leaks about the payload", async () => {
    const result = await registerAction({}, new FormData());

    expect(result.error).toBe("Registration is disabled.");
    expect(registerUserMock).not.toHaveBeenCalled();
  });

  it("registers when the flag is on", async () => {
    envMock.REGISTRATION_ENABLED = true;
    registerUserMock.mockResolvedValue({ ok: true, value: { id: "user-1" } });

    await expect(registerAction({}, validForm())).rejects.toThrow("NEXT_REDIRECT");
    expect(registerUserMock).toHaveBeenCalledOnce();
  });
});
