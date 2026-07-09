import type { PushSubscriptionRecord } from "@/modules/notifications/domain/push-subscription";

export type CreatePushSubscriptionInput = {
  readonly userId: string;
  readonly endpoint: string;
  readonly p256dh: string;
  readonly auth: string;
};

export interface PushSubscriptionRepository {
  findByUser(userId: string): Promise<PushSubscriptionRecord[]>;
  upsert(input: CreatePushSubscriptionInput): Promise<PushSubscriptionRecord>;
  deleteByEndpoint(endpoint: string): Promise<void>;
}
