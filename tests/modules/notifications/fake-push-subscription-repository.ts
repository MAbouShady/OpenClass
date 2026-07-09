import type { PushSubscriptionRecord } from "@/modules/notifications/domain/push-subscription";
import type {
  CreatePushSubscriptionInput,
  PushSubscriptionRepository,
} from "@/modules/notifications/domain/push-subscription-repository";

export class FakePushSubscriptionRepository implements PushSubscriptionRepository {
  private subscriptions: PushSubscriptionRecord[];
  private nextId = 1;

  constructor(seed: PushSubscriptionRecord[] = []) {
    this.subscriptions = seed;
  }

  async findByUser(userId: string): Promise<PushSubscriptionRecord[]> {
    return this.subscriptions.filter((subscription) => subscription.userId === userId);
  }

  async upsert(input: CreatePushSubscriptionInput): Promise<PushSubscriptionRecord> {
    const existingIndex = this.subscriptions.findIndex((sub) => sub.endpoint === input.endpoint);
    const record: PushSubscriptionRecord = {
      id: existingIndex >= 0 ? this.subscriptions[existingIndex]!.id : `sub-${this.nextId++}`,
      ...input,
    };
    if (existingIndex >= 0) {
      this.subscriptions[existingIndex] = record;
    } else {
      this.subscriptions.push(record);
    }
    return record;
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    this.subscriptions = this.subscriptions.filter((sub) => sub.endpoint !== endpoint);
  }
}
