import { z } from "zod";
import { ROLES } from "@/modules/auth/domain/role";

export const registerUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(1).nullish().transform((v) => v || null),
  email: z.string().trim().email().toLowerCase().nullish().transform((v) => v || null),
  password: z.string().min(8).max(72),
  role: z.enum(ROLES),
  locale: z.enum(["en", "ar"]).default("en"),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
