"use client";

import { useEffect, useState } from "react";
import { Download, X, Share2 } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
}

function isInStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

const STORAGE_KEY = "pwa-banner-dismissed";

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInStandalone()) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (isIos()) {
      setShowIos(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setPrompt(null);
  }

  if (!visible) return null;

  return (
    <div className="md:hidden w-full bg-primary text-primary-foreground px-4 py-2.5 flex items-center gap-3">
      <Download size={16} className="shrink-0 opacity-80" />

      <div className="flex-1 min-w-0 text-sm">
        {showIos && !prompt ? (
          <span className="flex items-center gap-1 flex-wrap leading-snug">
            Tap <Share2 size={12} className="inline shrink-0" /> then
            <span className="font-semibold">"Add to Home Screen"</span>
          </span>
        ) : (
          <span>Install <strong>OpenClass</strong> — add to home screen</span>
        )}
      </div>

      {prompt && (
        <button
          onClick={install}
          className="shrink-0 rounded-md bg-primary-foreground/15 hover:bg-primary-foreground/25 px-3 py-1 text-xs font-bold transition-colors"
        >
          Install
        </button>
      )}

      <button
        onClick={dismiss}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity p-1"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
