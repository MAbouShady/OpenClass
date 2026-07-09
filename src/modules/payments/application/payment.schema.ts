import { z } from "zod";

const notesField = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((value) => (value ? value : null));

export const submitOnlinePaymentSchema = z.object({
  enrollmentId: z.string().min(1),
  month: z.coerce.date(),
  proofUrl: z.string().trim().min(1).max(500),
  notes: notesField,
});

export type SubmitOnlinePaymentSchemaInput = z.infer<typeof submitOnlinePaymentSchema>;

export const markCashPaymentSchema = z.object({
  enrollmentId: z.string().min(1),
  month: z.coerce.date(),
  approvedById: z.string().min(1),
  notes: notesField,
});

export type MarkCashPaymentSchemaInput = z.infer<typeof markCashPaymentSchema>;

export const approvePaymentSchema = z.object({
  id: z.string().min(1),
  approvedById: z.string().min(1),
});

export type ApprovePaymentSchemaInput = z.infer<typeof approvePaymentSchema>;
