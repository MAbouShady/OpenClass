"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchPlaybackAuthorization,
  type PlaybackAuthorization,
} from "@/modules/recordings/presentation/playback-api";

/** Renew this many seconds before the authorization actually expires. */
const RENEW_MARGIN_SECONDS = 45;

type PlaybackState = {
  readonly authorization: PlaybackAuthorization | null;
  readonly loading: boolean;
  readonly error: string | null;
};

const INITIAL: PlaybackState = { authorization: null, loading: true, error: null };

/** The slice of hls.js's error payload this hook actually reads. */
type HlsErrorData = {
  readonly fatal: boolean;
  readonly type: string;
  readonly response?: { readonly code?: number };
};

/**
 * Attaches a private HLS stream to a <video> element.
 *
 * Playback authorizations are deliberately short-lived, so this re-requests one
 * before the current token expires and reloads the source in place, keeping the
 * viewer's position. Native HLS (Safari) and hls.js are both handled.
 */
export function useHlsPlayback(
  recordedVideoId: string,
  videoRef: React.RefObject<HTMLVideoElement | null>,
) {
  const [state, setState] = useState<PlaybackState>(INITIAL);
  const [loadedFor, setLoadedFor] = useState(recordedVideoId);
  const renewRef = useRef<() => void>(() => {});

  // Reset during render rather than in an effect when the lesson changes.
  if (loadedFor !== recordedVideoId) {
    setLoadedFor(recordedVideoId);
    setState(INITIAL);
  }

  useEffect(() => {
    /**
     * Teardown uses a plain flag rather than an AbortController.
     *
     * Aborting an in-flight fetch makes Chrome surface an AbortError that no
     * user-land handler can claim — it is reported as an unhandled rejection
     * even when the awaiting code catches it — which fills the dev overlay and
     * production error reporting with noise on every lesson change. The
     * authorization request is a small JSON GET, so letting it finish and
     * discarding the result is cheaper than the noise. hls.js is still torn
     * down explicitly below.
     */
    let cancelled = false;
    let renewTimer: ReturnType<typeof setTimeout> | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hls.js is loaded lazily; its type is not needed here.
    let hls: any = null;
    let renewedOnce = false;

    async function attach(authorization: PlaybackAuthorization, resumeAt: number) {
      const video = videoRef.current;
      if (!video) return;

      // hls.js first, native HLS only as the fallback. Chrome answers "maybe"
      // to canPlayType for the HLS MIME type while having no native support at
      // all, so trusting canPlayType here silently breaks playback everywhere
      // except Safari.
      const { default: Hls } = await import("hls.js");
      if (cancelled) return;

      if (Hls.isSupported()) {
        hls?.destroy();
        hls = new Hls({ enableWorker: true, lowLatencyMode: false });

        // Without this, a refused or dropped segment leaves the player
        // spinning forever instead of saying anything.
        hls.on(Hls.Events.ERROR, (_event: unknown, data: HlsErrorData) => {
          if (!data.fatal) return;

          const status = data.response?.code;
          // An expired or rejected authorization is worth exactly one silent
          // retry with a fresh token before it becomes a visible error.
          if ((status === 401 || status === 403) && !renewedOnce) {
            renewedOnce = true;
            void run(videoRef.current?.currentTime ?? 0).catch(() => {});
            return;
          }

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls?.startLoad();
            return;
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
            return;
          }

          setState({ authorization: null, loading: false, error: "playback" });
        });

        hls.loadSource(authorization.playlistUrl);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl") !== "") {
        // Safari / iOS: MSE is unavailable but the platform plays HLS itself.
        video.src = authorization.playlistUrl;
      } else {
        setState({ authorization: null, loading: false, error: "unsupported" });
        return;
      }

      if (resumeAt > 0) {
        const seek = () => {
          video.currentTime = resumeAt;
          video.removeEventListener("loadedmetadata", seek);
        };
        video.addEventListener("loadedmetadata", seek);
      }
    }

    async function run(resumeAt: number | null) {
      try {
        const authorization = await fetchPlaybackAuthorization(recordedVideoId);
        if (!authorization || cancelled) return;

        setState({ authorization, loading: false, error: null });
        renewedOnce = false;
        await attach(authorization, resumeAt ?? authorization.resumePositionSeconds);
        if (cancelled) return;

        const msUntilRenew = Math.max(
          10_000,
          new Date(authorization.expiresAt).getTime() - Date.now() - RENEW_MARGIN_SECONDS * 1000,
        );
        if (renewTimer) clearTimeout(renewTimer);
        renewTimer = setTimeout(() => {
          void run(videoRef.current?.currentTime ?? 0).catch(() => {});
        }, msUntilRenew);
      } catch (error) {
        if (cancelled) return;
        setState({
          authorization: null,
          loading: false,
          error: error instanceof Error ? error.message : "Playback is unavailable.",
        });
      }
    }

    renewRef.current = () => void run(videoRef.current?.currentTime ?? 0).catch(() => {});
    void run(null).catch(() => {});

    return () => {
      cancelled = true;
      if (renewTimer) clearTimeout(renewTimer);
      hls?.destroy();
      hls = null;
    };
  }, [recordedVideoId, videoRef]);

  /** Forces a new authorization, e.g. after a segment request was refused. */
  const renew = useCallback(() => renewRef.current(), []);

  return { ...state, renew };
}
