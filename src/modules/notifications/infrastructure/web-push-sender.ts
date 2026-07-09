import webpush from "web-push";
import { env } from "@/shared/config/env";
import type {
  NotificationPayload,
  NotificationSender,
  NotificationTarget,
} from "@/modules/notifications/domain/notification-sender";

webpush.setVapidDetails(env.VAPID_SUBJECT, env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

export class WebPushSender implements NotificationSender {
  async send(
    target: NotificationTarget,
    payload: NotificationPayload,
  ): Promise<{ expired: boolean }> {
    try {
      await webpush.sendNotification(
        {
          endpoint: target.endpoint,
          keys: { p256dh: target.p256dh, auth: target.auth },
        },
        JSON.stringify(payload),
      );
      return { expired: false };
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      return { expired: statusCode === 404 || statusCode === 410 };
    }
  }
}
