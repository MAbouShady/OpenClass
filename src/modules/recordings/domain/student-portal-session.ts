import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/shared/config/env";

/**
 * Session for a student who signed in with nothing but their code number.
 *
 * The code number itself never travels in a URL and is never stored client-side:
 * it is exchanged once for this signed, expiring cookie value. That keeps a
 * lesson link from being a permanent, forwardable pass to someone's videos.
 */
export type StudentPortalSession = {
  /** Student id. */
  readonly s: string;
  /** Expiry, epoch seconds. */
  readonly e: number;
};

export const STUDENT_PORTAL_COOKIE = "oc_student_portal";

/** Twelve hours — long enough for a study session, short enough to lapse. */
export const STUDENT_PORTAL_TTL_SECONDS = 12 * 60 * 60;

/**
 * Signed in a distinct context from playback tokens, so neither kind of token
 * can ever be replayed as the other.
 */
function sign(encodedPayload: string): string {
  return createHmac("sha256", env.VIDEO_SECRET)
    .update(`student-portal.v1.${encodedPayload}`)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createStudentPortalSession(
  studentId: string,
  ttlSeconds: number = STUDENT_PORTAL_TTL_SECONDS,
  now: Date = new Date(),
): { readonly value: string; readonly expiresAt: Date } {
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  const payload: StudentPortalSession = { s: studentId, e: Math.floor(expiresAt.getTime() / 1000) };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return { value: `${encoded}.${sign(encoded)}`, expiresAt };
}

export function verifyStudentPortalSession(
  value: string | undefined,
  now: Date = new Date(),
): StudentPortalSession | null {
  if (!value) return null;

  const [encoded, signature] = value.split(".");
  if (!encoded || !signature || !safeEqual(sign(encoded), signature)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as StudentPortalSession).s !== "string" ||
      typeof (parsed as StudentPortalSession).e !== "number"
    ) {
      return null;
    }

    const session = parsed as StudentPortalSession;
    if (session.e * 1000 <= now.getTime()) return null;
    return session;
  } catch {
    return null;
  }
}
