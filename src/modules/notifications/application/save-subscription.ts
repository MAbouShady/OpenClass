import type { PushSubscriptionRecord } from "@/modules/notifications/domain/push-subscription";
import type { PushSubscriptionRepository } from "@/modules/notifications/domain/push-subscription-repository";
import {
  saveSubscriptionSchema,
  type SaveSubscriptionSchemaInput,
} from "@/modules/notifications/application/save-subscription.schema";

export type SaveSubscriptionDeps = {
  readonly pushSubscriptionRepository: PushSubscriptionRepository;
};

export function saveSubscription(
  deps: SaveSubscriptionDeps,
  input: SaveSubscriptionSchemaInput,
): Promise<PushSubscriptionRecord> {
  const parsed = saveSubscriptionSchema.parse(input);
  return deps.pushSubscriptionRepository.upsert(parsed);
}
