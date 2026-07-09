import { z } from "zod";

export const createSemesterSchema = z.object({
  courseId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type CreateSemesterSchemaInput = z.infer<typeof createSemesterSchema>;

export const deleteSemesterSchema = z.object({
  id: z.string().min(1),
});

export type DeleteSemesterSchemaInput = z.infer<typeof deleteSemesterSchema>;
