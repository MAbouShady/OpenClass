import "server-only";
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
});

export const env = envSchema.parse(process.env);
