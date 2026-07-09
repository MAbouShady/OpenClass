export type NotificationPayload = {
  readonly title: string;
  readonly body: string;
  readonly url?: string;
};

export type NotificationTarget = {
  readonly endpoint: string;
  readonly p256dh: string;
  readonly auth: string;
};

export interface NotificationSender {
  send(target: NotificationTarget, payload: NotificationPayload): Promise<{ expired: boolean }>;
}
