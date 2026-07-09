import { z } from "zod";
import { SESSION_TYPES } from "@/modules/courses/domain/session-type";

export const createCourseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => (value ? value : null)),
  sessionType: z.enum(SESSION_TYPES),
  levelId: z.string().min(1),
  teacherId: z.string().min(1),
});

export type CreateCourseSchemaInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema.omit({ teacherId: true }).extend({
  id: z.string().min(1),
});

export type UpdateCourseSchemaInput = z.infer<typeof updateCourseSchema>;

export const deleteCourseSchema = z.object({
  id: z.string().min(1),
});

export type DeleteCourseSchemaInput = z.infer<typeof deleteCourseSchema>;
