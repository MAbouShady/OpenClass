"use server";

import { auth, signOut } from "@/auth";
import { saveSubscription } from "@/modules/notifications/application/save-subscription";
import { PrismaPushSubscriptionRepository } from "@/modules/notifications/infrastructure/prisma-push-subscription-repository";

const pushSubscriptionRepository = new PrismaPushSubscriptionRepository();

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function saveSubscriptionAction(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: "You must be signed in." };

  await saveSubscription(
    { pushSubscriptionRepository },
    {
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  );
  return {};
}
