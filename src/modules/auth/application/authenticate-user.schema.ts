import { z } from "zod";

export const authenticateUserSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
});

export type AuthenticateUserInput = z.infer<typeof authenticateUserSchema>;
