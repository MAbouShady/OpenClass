"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { registerUser } from "@/modules/auth/application/register-user";
import { registerUserSchema } from "@/modules/auth/application/register-user.schema";
import { BcryptPasswordHasher } from "@/modules/auth/infrastructure/bcrypt-password-hasher";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE_NAME, type Locale } from "@/i18n/locale";
import { env } from "@/shared/config/env";
import type { ActionState } from "@/shared/domain/action-state";

const userRepository = new PrismaUserRepository();
const passwordHasher = new BcryptPasswordHasher();

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // The page redirects when registration is off, but server actions are reachable
  // by POST regardless of whether the page ever renders. Guard the action itself.
  if (!env.REGISTRATION_ENABLED) {
    return { error: "Registration is disabled." };
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale: Locale = LOCALES.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : DEFAULT_LOCALE;

  const parsed = registerUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    // Pinned server-side. Self-registration only ever creates a teacher; the
    // role must never come from the request, or a caller could ask for ADMIN.
    role: "TEACHER",
    locale,
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
