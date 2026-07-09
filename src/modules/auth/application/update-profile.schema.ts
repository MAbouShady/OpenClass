import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  bio: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => (value ? value : null)),
});

export type UpdateProfileSchemaInput = z.infer<typeof updateProfileSchema>;
