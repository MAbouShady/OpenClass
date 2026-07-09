import { z } from "zod";

export const createClassSessionSchema = z.object({
  courseId: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
});

export type CreateClassSessionSchemaInput = z.infer<typeof createClassSessionSchema>;

export const deleteClassSessionSchema = z.object({
  id: z.string().min(1),
});

export type DeleteClassSessionSchemaInput = z.infer<typeof deleteClassSessionSchema>;
