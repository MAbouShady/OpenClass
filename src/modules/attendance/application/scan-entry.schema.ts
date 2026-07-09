import { z } from "zod";

export const scanEntrySchema = z.object({
  qrToken: z.string().min(1),
  sessionId: z.string().min(1),
});

export type ScanEntrySchemaInput = z.infer<typeof scanEntrySchema>;

export const scanExitSchema = scanEntrySchema;

export type ScanExitSchemaInput = z.infer<typeof scanExitSchema>;
