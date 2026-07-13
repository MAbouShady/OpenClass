import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1),
  email: z.string().trim().nullish().transform((v) => v || null),
  idNumber: z.coerce.number().int().positive().optional(),
  levelId: z
    .string()
    .trim()
    .nullish()
    .transform((v) => v || null),
  parentId: z
    .string()
    .trim()
    .nullish()
    .transform((v) => v || null),
  semesterIds: z.array(z.string()).default([]),
});

export type CreateStudentSchemaInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  phone: z
    .string()
    .trim()
    .nullish()
    .transform((v) => v || null),
  idNumber: z.coerce.number().int().positive().nullish().transform((v) => v ?? null),
  levelId: z
    .string()
    .trim()
    .nullish()
    .transform((v) => v || null),
  parentId: z
    .string()
    .trim()
    .nullish()
    .transform((v) => v || null),
});

export type UpdateStudentSchemaInput = z.infer<typeof updateStudentSchema>;

export const deleteStudentSchema = z.object({
  id: z.string().min(1),
});
