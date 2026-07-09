import type {
  NotificationPayload,
  NotificationSender,
} from "@/modules/notifications/domain/notification-sender";
import type { PushSubscriptionRepository } from "@/modules/notifications/domain/push-subscription-repository";

export type SendNotificationToUserDeps = {
  readonly pushSubscriptionRepository: PushSubscriptionRepository;
  readonly notificationSender: NotificationSender;
};

export async function sendNotificationToUser(
  deps: SendNotificationToUserDeps,
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  const subscriptions = await deps.pushSubscriptionRepository.findByUser(userId);

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const { expired } = await deps.notificationSender.send(subscription, payload);
      if (expired) {
        await deps.pushSubscriptionRepository.deleteByEndpoint(subscription.endpoint);
      }
    }),
  );
}
