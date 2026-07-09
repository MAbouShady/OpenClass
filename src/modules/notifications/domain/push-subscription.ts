export type PushSubscriptionRecord = {
  readonly id: string;
  readonly userId: string;
  readonly endpoint: string;
  readonly p256dh: string;
  readonly auth: string;
};
