"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PlayerControls } from "@/modules/recordings/presentation/player-controls";
import { VideoWatermark } from "@/modules/recordings/presentation/video-watermark";
import { useHlsPlayback } from "@/modules/recordings/presentation/use-hls-playback";
import { reportProgress } from "@/modules/recordings/presentation/playback-api";

/** How often an actively playing lesson reports its position. */
const PROGRESS_INTERVAL_MS = 15_000;

type VideoPlayerProps = {
  readonly recordedVideoId: string;
  readonly title: string;
  readonly watermarkLabel: string;
  readonly onProgress?: (completed: boolean) => void;
};

export function VideoPlayer({
  recordedVideoId,
  title,
  watermarkLabel,
  onProgress,
}: VideoPlayerProps) {
  const t = useTranslations("recordings");
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  /** Tracks the last completion state we acted on, so we refresh once, not every tick. */
  const completedRef = useRef(false);
  /** Ending a video fires `ended` and `pause` together; only one save is wanted. */
  const flushInFlightRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { authorization, loading, error, renew } = useHlsPlayback(recordedVideoId, videoRef);

  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  const flushProgress = useCallback(async () => {
    const video = videoRef.current;
    if (!video || Number.isNaN(video.currentTime)) return;
    if (flushInFlightRef.current) return;

    flushInFlightRef.current = true;
    let saved;
    try {
      saved = await reportProgress(recordedVideoId, video.currentTime);
    } finally {
      flushInFlightRef.current = false;
    }
    if (!saved) return;

    onProgress?.(saved.completed);

    // Course progress and the lesson ticks are rendered on the server, so
    // finishing a lesson has to invalidate them — otherwise the bar sits at its
    // load-time value until the student reloads, and the last lesson never
    // appears to reach 100%.
    if (saved.completed && !completedRef.current) {
      completedRef.current = true;
      router.refresh();
    }
  }, [onProgress, recordedVideoId, router]);

  // Seed from what the server already knows, so re-opening a finished lesson
  // does not trigger a refresh it does not need.
  useEffect(() => {
    completedRef.current = authorization?.completed ?? false;
  }, [authorization]);

  // Periodic save while playing, plus a save on pause, on end and on unload,
  // so a closed tab never loses more than one interval of watch time.
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => void flushProgress(), PROGRESS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [playing, flushProgress]);

  useEffect(() => {
    const handleLeave = () => void flushProgress();
    window.addEventListener("pagehide", handleLeave);
    return () => {
      window.removeEventListener("pagehide", handleLeave);
      void flushProgress();
    };
  }, [flushProgress]);

  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen?.();
    }
  }, []);

  if (error === "unsupported") {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("playerUnsupported")}</AlertDescription>
      </Alert>
    );
  }

  if (error === "playback") {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="destructive">
          <AlertDescription>{t("playbackFailed")}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" className="self-start" onClick={renew}>
          {t("tryAgain")}
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" className="self-start" onClick={renew}>
          {t("tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black"
    >
      <video
        ref={videoRef}
        poster={authorization?.posterUrl ?? undefined}
        title={title}
        playsInline
        // Removes the browser's own download affordance. It is a deterrent, not
        // a guarantee — see the security notes in docs/recorded-courses.md.
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(event) => event.preventDefault()}
        className="h-full w-full"
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          void flushProgress();
        }}
        onEnded={() => {
          setPlaying(false);
          void flushProgress();
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setCurrentTime(video.currentTime);
          if (video.buffered.length > 0) {
            setBuffered(video.buffered.end(video.buffered.length - 1));
          }
        }}
        onVolumeChange={(event) => {
          setMuted(event.currentTarget.muted);
          setVolume(event.currentTarget.volume);
        }}
      />

      <VideoWatermark label={watermarkLabel} />

      {(loading || buffering) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/80" />
        </div>
      )}

      <PlayerControls
        playing={playing}
        currentTime={currentTime}
        duration={duration || (authorization?.durationSeconds ?? 0)}
        buffered={buffered}
        muted={muted}
        volume={volume}
        playbackRate={playbackRate}
        onTogglePlay={() => {
          const video = videoRef.current;
          if (!video) return;
          // A rejected play() (autoplay policy, source not ready) must not
          // escape as an unhandled rejection.
          if (video.paused) void video.play().catch(() => {});
          else video.pause();
        }}
        onSeek={(seconds) => {
          if (videoRef.current) videoRef.current.currentTime = seconds;
        }}
        onToggleMute={() => {
          if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
        }}
        onVolume={(value) => {
          if (!videoRef.current) return;
          videoRef.current.volume = value;
          videoRef.current.muted = value === 0;
        }}
        onRate={(value) => {
          setPlaybackRate(value);
          if (videoRef.current) videoRef.current.playbackRate = value;
        }}
        onFullscreen={handleFullscreen}
      />
    </div>
  );
}
