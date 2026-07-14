import { z } from "zod";

const nullableString = z
  .string()
  .nullish()
  .transform((v) => v || null);

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  bio: z.string().max(50000).nullish().transform((v) => v || null),
  photoUrl: nullableString,
  coverUrl: nullableString,
  coverOffsetY: z.coerce.number().min(0).max(100).default(50),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullish()
    .transform((v) => v || null),
  paymentDetails: z.string().max(50000).nullish().transform((v) => v || null),
  locale: z.enum(["en", "ar"]).default("en"),
});

export type UpdateProfileSchemaInput = z.infer<typeof updateProfileSchema>;
