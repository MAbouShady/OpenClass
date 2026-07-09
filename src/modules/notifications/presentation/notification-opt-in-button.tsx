"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { saveSubscriptionAction } from "@/app/dashboard/actions";

function urlBase64ToUint8Array(base64Url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const array = Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  return array.buffer;
}

export function NotificationOptInButton() {
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""),
      });

      const json = subscription.toJSON();
      if (json.endpoint && json.keys?.p256dh && json.keys.auth) {
        await saveSubscriptionAction({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        });
        setEnabled(true);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleClick}
          disabled={pending || enabled}
        >
          {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {enabled ? "Notifications enabled" : "Enable notifications"}
      </TooltipContent>
    </Tooltip>
  );
}
