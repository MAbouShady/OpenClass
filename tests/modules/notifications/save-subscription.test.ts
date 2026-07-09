import { describe, expect, it } from "vitest";
import { saveSubscription } from "@/modules/notifications/application/save-subscription";
import { FakePushSubscriptionRepository } from "./fake-push-subscription-repository";

describe("saveSubscription", () => {
  it("creates a new subscription", async () => {
    const pushSubscriptionRepository = new FakePushSubscriptionRepository();

    const record = await saveSubscription(
      { pushSubscriptionRepository },
      {
        userId: "user-1",
        endpoint: "https://push.example.com/a",
        p256dh: "p1",
        auth: "a1",
      },
    );

    expect(record).toMatchObject({ userId: "user-1", endpoint: "https://push.example.com/a" });
  });

  it("upserts on the same endpoint instead of duplicating", async () => {
    const pushSubscriptionRepository = new FakePushSubscriptionRepository();

    await saveSubscription(
      { pushSubscriptionRepository },
      { userId: "user-1", endpoint: "https://push.example.com/a", p256dh: "p1", auth: "a1" },
    );
    await saveSubscription(
      { pushSubscriptionRepository },
      { userId: "user-1", endpoint: "https://push.example.com/a", p256dh: "p2", auth: "a2" },
    );

    const subscriptions = await pushSubscriptionRepository.findByUser("user-1");
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0]?.p256dh).toBe("p2");
  });
});
