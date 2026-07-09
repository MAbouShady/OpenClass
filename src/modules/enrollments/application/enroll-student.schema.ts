import { z } from "zod";

export const enrollStudentSchema = z.object({
  studentId: z.string().min(1),
  semesterId: z.string().min(1),
});

export type EnrollStudentSchemaInput = z.infer<typeof enrollStudentSchema>;
