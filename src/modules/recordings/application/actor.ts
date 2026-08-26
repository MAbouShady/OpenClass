import type { Role } from "@/modules/auth/domain/role";

/**
 * Who is acting on a recorded video. Mirrors the permission model the app
 * already uses: admins see everything, a teacher owns their own courses, and a
 * secretary acts on behalf of exactly one teacher.
 */
export type RecordingActor = {
  readonly userId: string;
  readonly role: Role;
  /** Teacher whose courses this actor may manage. Null for admins (all courses). */
  readonly managedTeacherId: string | null;
};

export function isCourseManager(actor: RecordingActor): boolean {
  return actor.role === "ADMIN" || actor.role === "TEACHER" || actor.role === "SECRETARY";
}

export function canManageCourse(
  actor: RecordingActor,
  course: { readonly teacherId: string },
): boolean {
  if (!isCourseManager(actor)) return false;
  if (actor.role === "ADMIN") return true;
  return actor.managedTeacherId !== null && actor.managedTeacherId === course.teacherId;
}
