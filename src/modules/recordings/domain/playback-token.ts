import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/shared/config/env";

/**
 * A playback authorization. Short-lived, signed server-side, and bound to a
 * single asset *and* a single viewer, so a leaked URL cannot be replayed by
 * someone else for long, and cannot be pointed at a different lesson at all.
 */
export type PlaybackTokenPayload = {
  /** Video asset id. */
  readonly a: string;
  /** Recorded video (lesson) id. */
  readonly v: string;
  /** Viewer id. */
  readonly u: string;
  /** Expiry, epoch seconds. */
  readonly e: number;
};

function sign(encodedPayload: string): string {
  return createHmac("sha256", env.VIDEO_SECRET).update(encodedPayload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function generatePlaybackToken(
  payload: Omit<PlaybackTokenPayload, "e">,
  ttlSeconds: number = env.PLAYBACK_TOKEN_TTL_SECONDS,
  now: Date = new Date(),
): { readonly token: string; readonly expiresAt: Date } {
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  const full: PlaybackTokenPayload = { ...payload, e: Math.floor(expiresAt.getTime() / 1000) };
  const encoded = Buffer.from(JSON.stringify(full), "utf8").toString("base64url");
  return { token: `${encoded}.${sign(encoded)}`, expiresAt };
}

/** Returns the payload only when the signature is valid *and* the token is unexpired. */
export function verifyPlaybackToken(
  token: string,
  now: Date = new Date(),
): PlaybackTokenPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || !safeEqual(sign(encoded), signature)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as PlaybackTokenPayload).a !== "string" ||
      typeof (parsed as PlaybackTokenPayload).v !== "string" ||
      typeof (parsed as PlaybackTokenPayload).u !== "string" ||
      typeof (parsed as PlaybackTokenPayload).e !== "number"
    ) {
      return null;
    }

    const payload = parsed as PlaybackTokenPayload;
    if (payload.e * 1000 <= now.getTime()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Gate for an individual playlist/segment request. The token must be valid,
 * unexpired, and issued for exactly the asset being requested — copying a
 * segment URL from one lesson to another gets nowhere.
 */
export function verifyStreamAccess(
  token: string,
  assetId: string,
  now: Date = new Date(),
): PlaybackTokenPayload | null {
  const payload = verifyPlaybackToken(token, now);
  if (!payload || payload.a !== assetId) return null;
  return payload;
}
