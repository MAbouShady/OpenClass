"use client";

import { useEffect, useState } from "react";

const POSITIONS = ["top-6 start-6", "top-6 end-6", "bottom-16 start-6", "bottom-16 end-6"] as const;

type VideoWatermarkProps = {
  readonly label: string;
};

/**
 * A moving, per-viewer overlay. It discourages casual screen-recording and
 * makes a leaked recording traceable — it is not, and cannot be, a technical
 * barrier to capture.
 */
export function VideoWatermark({ label }: VideoWatermarkProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % POSITIONS.length);
    }, 20_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 select-none rounded bg-black/25 px-2 py-1 text-[10px] font-medium leading-tight text-white/70 transition-all duration-700 sm:text-xs ${POSITIONS[index]}`}
    >
      {label}
    </div>
  );
}
