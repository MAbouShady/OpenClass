import { z } from "zod";

export const saveSubscriptionSchema = z.object({
  userId: z.string().min(1),
  endpoint: z.url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export type SaveSubscriptionSchemaInput = z.infer<typeof saveSubscriptionSchema>;
