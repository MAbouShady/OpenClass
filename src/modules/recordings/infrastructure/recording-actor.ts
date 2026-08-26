import "server-only";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/shared/infrastructure/prisma/client";
import type { RecordingActor } from "@/modules/recordings/application/actor";
import {
  STUDENT_PORTAL_COOKIE,
  verifyStudentPortalSession,
} from "@/modules/recordings/domain/student-portal-session";
import { PrismaStudentDirectory } from "@/modules/recordings/infrastructure/prisma-student-directory";

const studentDirectory = new PrismaStudentDirectory();

/**
 * Students sign in with a code number, not a password, so they have no NextAuth
 * session. Their identity comes from the signed portal cookie instead — and is
 * re-checked against the database on every request, so a student who is deleted
 * or is no longer a student stops being one immediately, cookie or not.
 */
export async function resolveStudentPortalActor(): Promise<RecordingActor | null> {
  const store = await cookies();
  const session = verifyStudentPortalSession(store.get(STUDENT_PORTAL_COOKIE)?.value);
  if (!session) return null;

  const student = await studentDirectory.findById(session.s);
  if (!student) return null;

  return { userId: student.id, role: "STUDENT", managedTeacherId: null };
}

/**
 * The current viewer's id, for checking a playback token on the segment path.
 *
 * Resolved in the same order as `resolveWatchActor`, so the id here always
 * matches the one `/play` minted the token for. Signature-only: the database
 * checks already ran when the token was issued.
 */
export async function resolveViewerId(): Promise<string | null> {
  const store = await cookies();
  const portal = verifyStudentPortalSession(store.get(STUDENT_PORTAL_COOKIE)?.value);
  if (portal) return portal.s;

  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Who is *watching*.
 *
 * The portal session wins over a staff session. Both can exist in one browser —
 * a teacher signed into the dashboard who then opens the portal with a student
 * code — and when they disagree the result is a split identity: the portal page
 * renders the student's lessons while playback and progress are attributed to
 * the teacher, so the student's progress silently lands on someone else's
 * account and their course bar never completes.
 *
 * Entering a code number is an explicit statement of who is watching, so it
 * takes precedence. Management surfaces are unaffected — they use
 * `resolveRecordingActor`, which is staff-only.
 */
export async function resolveWatchActor(): Promise<RecordingActor | null> {
  const portalActor = await resolveStudentPortalActor();
  if (portalActor) return portalActor;

  return resolveRecordingActor();
}

/**
 * The acting identity for *managing* recorded courses. Staff sessions only —
 * a code-number portal session never confers management rights.
 *
 * A secretary inherits exactly the courses of the teacher they belong to, the
 * same rule the attendance pages already apply.
 */
export async function resolveRecordingActor(): Promise<RecordingActor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const role = session.user.role;

  if (role === "SECRETARY") {
    const row = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { secretaryOfId: true },
    });
    return { userId: session.user.id, role, managedTeacherId: row?.secretaryOfId ?? null };
  }

  return {
    userId: session.user.id,
    role,
    managedTeacherId: role === "TEACHER" ? session.user.id : null,
  };
}
