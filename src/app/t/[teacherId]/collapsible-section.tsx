"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  heading: string;
  accent: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  blink?: boolean;
  listenForOpen?: string;
  collapsedCta?: React.ReactNode;
};

export function CollapsibleSection({
  heading,
  accent,
  children,
  defaultOpen = false,
  blink = false,
  listenForOpen,
  collapsedCta,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!listenForOpen) return;
    const handler = () => setOpen(true);
    window.addEventListener(listenForOpen, handler);
    return () => window.removeEventListener(listenForOpen, handler);
  }, [listenForOpen]);

  const shouldBlink = blink && !open;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`mb-4 w-full rounded-lg border-s-4 bg-muted/40 px-4 py-2.5 flex items-center justify-between gap-2 text-start hover:bg-muted/60 transition-colors${shouldBlink ? " animate-pulse" : ""}`}
        style={{ borderColor: accent }}
      >
        <h2 className="text-base font-semibold tracking-tight">{heading}</h2>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && children}
      {!open && collapsedCta}
    </section>
  );
}
