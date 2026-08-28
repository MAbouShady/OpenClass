import "server-only";
import { join } from "node:path";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  NEXT_PUBLIC_APP_URL: z.url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  AUTH_SECRET: z.string().min(32),
  QR_SECRET: z.string().min(32),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_SUBJECT: z.string().min(1),
  /**
   * Public self-registration at `/register`. Off unless explicitly set to "true".
   * Anything else (unset, "false", "1", "yes") keeps registration closed.
   */
  REGISTRATION_ENABLED: z
    .string()
    .optional()
    .transform((value) => value === "true"),

  // ── Recorded courses / video pipeline ────────────────────────────────────
  /** Private media root. MUST live outside `public/` so nothing is ever served statically. */
  MEDIA_ROOT: z
    .string()
    .min(1)
    .default(join(process.cwd(), "storage", "media")),
  /** Signing key for short-lived playback tokens. Falls back to AUTH_SECRET. */
  VIDEO_SECRET: z.string().min(32).optional(),
  FFMPEG_PATH: z.string().min(1).default("ffmpeg"),
  FFPROBE_PATH: z.string().min(1).default("ffprobe"),
  /** Hard ceiling for a single uploaded video. Default 2 GiB. */
  MAX_VIDEO_UPLOAD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(2 * 1024 * 1024 * 1024),
  /** Lifetime of a playback authorization, in seconds. Keep this short. */
  PLAYBACK_TOKEN_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  /** Percentage of a lesson that counts as "completed". */
  LESSON_COMPLETION_THRESHOLD: z.coerce.number().int().min(50).max(100).default(92),
  /** Set to "false" to keep the in-process video worker from starting (e.g. on a web-only node). */
  VIDEO_WORKER_ENABLED: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  VIDEO_SECRET: parsed.VIDEO_SECRET ?? parsed.AUTH_SECRET,
};
