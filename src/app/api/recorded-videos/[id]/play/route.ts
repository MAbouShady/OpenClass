import { NextResponse, type NextRequest } from "next/server";
import { DomainError } from "@/shared/domain/result";
import { authorizePlayback } from "@/modules/recordings/application/authorize-playback";
import { generatePlaybackToken } from "@/modules/recordings/domain/playback-token";
import { playbackRateLimiter, recordings } from "@/modules/recordings/infrastructure/container";
import { resolveWatchActor } from "@/modules/recordings/infrastructure/recording-actor";
import {
  errorResponse,
  internalError,
  tooManyRequests,
  unauthorized,
} from "@/modules/recordings/infrastructure/api-response";

/**
 * Playback authorization.
 *
 * Verifies sign-in, course existence and availability, enrolment, lesson
 * publication and processing state, then mints a short-lived token. The token
 * is the *only* thing that opens the stream, and it dies within minutes.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveWatchActor();
  if (!actor) return unauthorized();

  if (!playbackRateLimiter.check(actor.userId)) {
    return tooManyRequests(playbackRateLimiter.retryAfterSeconds(actor.userId));
  }

  const { id } = await params;

  try {
    const authorized = await authorizePlayback(recordings, actor, id);
    if (!authorized.ok) return errorResponse(authorized.error);

    const { asset, recordedVideoId } = authorized.value;
    const { token, expiresAt } = generatePlaybackToken({
      a: asset.id,
      v: recordedVideoId,
      u: actor.userId,
    });

    const progress = await recordings.lessonProgressRepository.find(actor.userId, recordedVideoId);
    const encodedToken = encodeURIComponent(token);

    return NextResponse.json(
      {
        recordedVideoId,
        playlistUrl: `/api/video/${asset.id}/master.m3u8?t=${encodedToken}`,
        posterUrl: asset.thumbnailKey
          ? `/api/video/${asset.id}/thumbnail.jpg?t=${encodedToken}`
          : null,
        expiresAt: expiresAt.toISOString(),
        durationSeconds: asset.durationSeconds ?? 0,
        resumePositionSeconds: progress?.lastPositionSeconds ?? 0,
        completed: progress?.completed ?? false,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof DomainError) return errorResponse(error);
    return internalError("playback authorization failed", error);
  }
}
