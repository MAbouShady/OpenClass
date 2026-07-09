import { describe, expect, it, vi } from "vitest";
import { sendNotificationToUser } from "@/modules/notifications/application/send-notification-to-user";
import type { NotificationSender } from "@/modules/notifications/domain/notification-sender";
import { FakePushSubscriptionRepository } from "./fake-push-subscription-repository";

describe("sendNotificationToUser", () => {
  it("sends to every subscription for the user", async () => {
    const pushSubscriptionRepository = new FakePushSubscriptionRepository([
      {
        id: "sub-1",
        userId: "user-1",
        endpoint: "https://push.example.com/a",
        p256dh: "p1",
        auth: "a1",
      },
      {
        id: "sub-2",
        userId: "user-1",
        endpoint: "https://push.example.com/b",
        p256dh: "p2",
        auth: "a2",
      },
      {
        id: "sub-3",
        userId: "user-2",
        endpoint: "https://push.example.com/c",
        p256dh: "p3",
        auth: "a3",
      },
    ]);
    const send = vi.fn().mockResolvedValue({ expired: false });
    const notificationSender: NotificationSender = { send };

    await sendNotificationToUser({ pushSubscriptionRepository, notificationSender }, "user-1", {
      title: "Hello",
      body: "World",
    });

    expect(send).toHaveBeenCalledTimes(2);
  });

  it("removes a subscription when the sender reports it as expired", async () => {
    const pushSubscriptionRepository = new FakePushSubscriptionRepository([
      {
        id: "sub-1",
        userId: "user-1",
        endpoint: "https://push.example.com/a",
        p256dh: "p1",
        auth: "a1",
      },
    ]);
    const notificationSender: NotificationSender = {
      send: vi.fn().mockResolvedValue({ expired: true }),
    };

    await sendNotificationToUser({ pushSubscriptionRepository, notificationSender }, "user-1", {
      title: "Hello",
      body: "World",
    });

    await expect(pushSubscriptionRepository.findByUser("user-1")).resolves.toEqual([]);
  });

  it("does nothing when the user has no subscriptions", async () => {
    const pushSubscriptionRepository = new FakePushSubscriptionRepository();
    const send = vi.fn();
    const notificationSender: NotificationSender = { send };

    await sendNotificationToUser({ pushSubscriptionRepository, notificationSender }, "user-1", {
      title: "Hello",
      body: "World",
    });

    expect(send).not.toHaveBeenCalled();
  });
});
