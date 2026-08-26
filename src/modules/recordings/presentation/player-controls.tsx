"use client";

import { useTranslations } from "next-intl";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { formatClock } from "@/modules/recordings/presentation/recorded-video-item";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

type PlayerControlsProps = {
  readonly playing: boolean;
  readonly currentTime: number;
  readonly duration: number;
  readonly buffered: number;
  readonly muted: boolean;
  readonly volume: number;
  readonly playbackRate: number;
  readonly onTogglePlay: () => void;
  readonly onSeek: (seconds: number) => void;
  readonly onToggleMute: () => void;
  readonly onVolume: (value: number) => void;
  readonly onRate: (value: number) => void;
  readonly onFullscreen: () => void;
};

export function PlayerControls({
  playing,
  currentTime,
  duration,
  buffered,
  muted,
  volume,
  playbackRate,
  onTogglePlay,
  onSeek,
  onToggleMute,
  onVolume,
  onRate,
  onFullscreen,
}: PlayerControlsProps) {
  const t = useTranslations("recordings");
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8 sm:px-4">
      {/* Scrubber */}
      <div className="relative mb-2 h-4">
        <div className="pointer-events-none absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/25">
          <div
            className="absolute inset-y-0 start-0 rounded-full bg-white/35"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="absolute inset-y-0 start-0 rounded-full bg-primary"
            style={{ width: `${percent}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={1}
          value={Math.min(currentTime, duration)}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label={t("seek")}
          className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent"
        />
      </div>

      <div className="flex items-center gap-2 text-white sm:gap-3">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={playing ? t("pause") : t("play")}
          className="rounded p-1 transition-colors hover:bg-white/15"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? t("unmute") : t("mute")}
            className="rounded p-1 transition-colors hover:bg-white/15"
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(event) => onVolume(Number(event.target.value))}
            aria-label={t("volume")}
            className="hidden w-16 cursor-pointer sm:block"
          />
        </div>

        {/* Forced LTR: a clock reads left-to-right even on an RTL page. */}
        <span dir="ltr" className="text-xs tabular-nums text-white/80">
          {formatClock(currentTime)} / {formatClock(duration)}
        </span>

        <div className="flex-1" />

        <select
          value={playbackRate}
          onChange={(event) => onRate(Number(event.target.value))}
          aria-label={t("playbackSpeed")}
          className="rounded border border-white/25 bg-black/40 px-1.5 py-0.5 text-xs text-white outline-none"
        >
          {SPEEDS.map((speed) => (
            <option key={speed} value={speed} className="text-black">
              {speed}×
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onFullscreen}
          aria-label={t("fullscreen")}
          className="rounded p-1 transition-colors hover:bg-white/15"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
