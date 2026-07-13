import { z } from "zod";

export const createLevelSchema = z.object({
  name: z.string().trim().min(2).max(60),
  order: z.coerce.number().int().min(0),
  description: z
    .string()
    .trim()
    .max(280)
    .nullish()
    .transform((value) => (value ? value : null)),
  parentLevelId: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value ? value : null)),
  teacherId: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value ? value : null)),
});

export type CreateLevelSchemaInput = z.infer<typeof createLevelSchema>;

export const updateLevelSchema = createLevelSchema
  .omit({ parentLevelId: true, teacherId: true })
  .extend({ id: z.string().min(1) });

export type UpdateLevelSchemaInput = z.infer<typeof updateLevelSchema>;

export const deleteLevelSchema = z.object({
  id: z.string().min(1),
});

export type DeleteLevelSchemaInput = z.infer<typeof deleteLevelSchema>;
