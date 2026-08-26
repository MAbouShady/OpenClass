"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateStudentByCode } from "@/modules/recordings/application/authenticate-student-by-code";
import {
  createStudentPortalSession,
  STUDENT_PORTAL_COOKIE,
  STUDENT_PORTAL_TTL_SECONDS,
} from "@/modules/recordings/domain/student-portal-session";
import { recordings, studentCodeRateLimiter } from "@/modules/recordings/infrastructure/container";
import type { ActionState } from "@/shared/domain/action-state";

/** Best-effort client key for rate limiting an endpoint with no session yet. */
async function clientKey(): Promise<string> {
  const store = await headers();
  return store.get("x-forwarded-for")?.split(",")[0]?.trim() ?? store.get("x-real-ip") ?? "unknown";
}

/**
 * Exchanges a code number for a signed, expiring portal session.
 *
 * The code is verified once here and then never leaves the server: it is not
 * placed in the URL, and the cookie carries an opaque signed student id instead.
 */
export async function signInWithCodeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const key = await clientKey();
  if (!studentCodeRateLimiter.check(key)) {
    return { error: "Too many attempts. Please wait a moment and try again." };
  }

  const result = await authenticateStudentByCode(recordings, { code: formData.get("code") });
  if (!result.ok) {
    return { error: result.error.message };
  }

  const session = createStudentPortalSession(result.value.id);
  const store = await cookies();
  store.set(STUDENT_PORTAL_COOKIE, session.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STUDENT_PORTAL_TTL_SECONDS,
  });

  redirect("/student-portal");
}

export async function signOutOfPortalAction(): Promise<void> {
  const store = await cookies();
  store.delete(STUDENT_PORTAL_COOKIE);
  redirect("/student-portal");
}
