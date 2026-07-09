"use server";

import { redirect } from "next/navigation";
import { registerUser } from "@/modules/auth/application/register-user";
import { registerUserSchema } from "@/modules/auth/application/register-user.schema";
import { BcryptPasswordHasher } from "@/modules/auth/infrastructure/bcrypt-password-hasher";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import type { ActionState } from "@/shared/domain/action-state";

const userRepository = new PrismaUserRepository();
const passwordHasher = new BcryptPasswordHasher();

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await registerUser({ userRepository, passwordHasher }, parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  redirect("/login");
}
