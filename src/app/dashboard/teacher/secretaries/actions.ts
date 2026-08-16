"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/shared/infrastructure/prisma/client";
import { BcryptPasswordHasher } from "@/modules/auth/infrastructure/bcrypt-password-hasher";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import type { ActionState } from "@/shared/domain/action-state";

const userRepository = new PrismaUserRepository();
const passwordHasher = new BcryptPasswordHasher();

export async function createSecretaryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") return { error: "Unauthorized." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || name.length < 2) return { error: "Name must be at least 2 characters." };
  if (!email || !email.includes("@")) return { error: "Valid email required." };
  if (!password || password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await userRepository.findByEmail(email);
  if (existing) return { error: "Email already in use." };

  const passwordHash = await passwordHasher.hash(password);
  await userRepository.createSecretary({
    name,
    email,
    passwordHash,
    teacherId: session.user.id,
  });

  revalidatePath("/dashboard/teacher/secretaries");
  return { message: "Secretary account created." };
}

export async function deleteSecretaryAction(secretaryId: string): Promise<void> {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") return;

  const row = await prisma.user.findUnique({
    where: { id: secretaryId },
    select: { role: true, secretaryOfId: true },
  });
  if (!row || row.role !== "SECRETARY" || row.secretaryOfId !== session.user.id) return;

  await userRepository.deleteById(secretaryId);
  revalidatePath("/dashboard/teacher/secretaries");
}
