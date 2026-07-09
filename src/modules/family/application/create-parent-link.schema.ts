import { z } from "zod";

export const createParentLinkSchema = z.object({
  parentEmail: z.email().toLowerCase(),
  studentEmail: z.email().toLowerCase(),
});

export type CreateParentLinkSchemaInput = z.infer<typeof createParentLinkSchema>;

export const deleteParentLinkSchema = z.object({
  id: z.string().min(1),
});

export type DeleteParentLinkSchemaInput = z.infer<typeof deleteParentLinkSchema>;
