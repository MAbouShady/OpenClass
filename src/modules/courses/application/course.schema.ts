import { z } from "zod";
import { SESSION_TYPES } from "@/modules/courses/domain/session-type";
import { PAYMENT_FREQUENCIES } from "@/modules/courses/domain/payment-frequency";

export const createCourseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => (value ? value : null)),
  sessionType: z.enum(SESSION_TYPES),
  paymentFrequency: z.enum(PAYMENT_FREQUENCIES).default("MONTHLY"),
  price: z.coerce.number().int().min(0).nullish().transform((v) => v ?? null),
  levelId: z.string().min(1),
  teacherId: z.string().min(1),
});

export type CreateCourseSchemaInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema.omit({ teacherId: true }).extend({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
});

export type UpdateCourseSchemaInput = z.infer<typeof updateCourseSchema>;

export const deleteCourseSchema = z.object({
  id: z.string().min(1),
});

export type DeleteCourseSchemaInput = z.infer<typeof deleteCourseSchema>;
