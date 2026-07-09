import { prisma } from "@/shared/infrastructure/prisma/client";
import type {
  CreatePushSubscriptionInput,
  PushSubscriptionRepository,
} from "@/modules/notifications/domain/push-subscription-repository";
import type { PushSubscriptionRecord } from "@/modules/notifications/domain/push-subscription";

export class PrismaPushSubscriptionRepository implements PushSubscriptionRepository {
  async findByUser(userId: string): Promise<PushSubscriptionRecord[]> {
    return prisma.pushSubscription.findMany({ where: { userId } });
  }

  async upsert(input: CreatePushSubscriptionInput): Promise<PushSubscriptionRecord> {
    return prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: input,
      update: input,
    });
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }
}
