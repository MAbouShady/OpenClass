export type PlaybackAuthorization = {
  readonly recordedVideoId: string;
  readonly playlistUrl: string;
  readonly posterUrl: string | null;
  readonly expiresAt: string;
  readonly durationSeconds: number;
  readonly resumePositionSeconds: number;
  readonly completed: boolean;
};

export type SavedProgress = {
  readonly progressPercent: number;
  readonly lastPositionSeconds: number;
  readonly completed: boolean;
};

/**
 * Asks the backend for a fresh, short-lived playback authorization.
 *
 * Returns null instead of rejecting when the request is cut short — a player
 * torn down mid-flight (navigating between lessons, or React re-running the
 * effect in development) is ordinary control flow, not an error worth
 * surfacing. The optional signal is honoured if a caller supplies one.
 */
export async function fetchPlaybackAuthorization(
  recordedVideoId: string,
  signal?: AbortSignal,
): Promise<PlaybackAuthorization | null> {
  let response: Response;
  try {
    response = await fetch(`/api/recorded-videos/${recordedVideoId}/play`, {
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (isAbort(error, signal)) return null;
    throw error;
  }

  let body: PlaybackAuthorization & { error?: string };
  try {
    body = (await response.json()) as PlaybackAuthorization & { error?: string };
  } catch (error) {
    // The body can be cut short by the same abort that spared the headers.
    if (isAbort(error, signal)) return null;
    throw error;
  }

  if (!response.ok) {
    throw new Error(body.error ?? "Playback is unavailable.");
  }
  return body;
}

function isAbort(error: unknown, signal?: AbortSignal): boolean {
  return signal?.aborted === true || (error instanceof DOMException && error.name === "AbortError");
}

/** Reports a playback position. Everything else is decided server-side. */
export async function reportProgress(
  recordedVideoId: string,
  positionSeconds: number,
): Promise<SavedProgress | null> {
  try {
    const response = await fetch(`/api/recorded-videos/${recordedVideoId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionSeconds: Math.floor(positionSeconds) }),
      keepalive: true,
    });
    if (!response.ok) return null;
    return (await response.json()) as SavedProgress;
  } catch {
    return null;
  }
}
