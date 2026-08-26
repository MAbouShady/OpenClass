import { NextResponse, type NextRequest } from "next/server";
import { DomainError } from "@/shared/domain/result";
import { saveLessonProgress } from "@/modules/recordings/application/save-lesson-progress";
import { progressRateLimiter, recordings } from "@/modules/recordings/infrastructure/container";
import { resolveWatchActor } from "@/modules/recordings/infrastructure/recording-actor";
import {
  errorResponse,
  internalError,
  tooManyRequests,
  unauthorized,
} from "@/modules/recordings/infrastructure/api-response";

/**
 * Records a playback position. The body carries a position and nothing else —
 * watched time, percentage and completion are all decided server-side.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveWatchActor();
  if (!actor) return unauthorized();

  const key = `progress:${actor.userId}`;
  if (!progressRateLimiter.check(key)) {
    return tooManyRequests(progressRateLimiter.retryAfterSeconds(key));
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as { positionSeconds?: unknown };
    const result = await saveLessonProgress(recordings, actor, {
      recordedVideoId: id,
      positionSeconds: Number(body.positionSeconds ?? 0),
    });
    if (!result.ok) return errorResponse(result.error);

    return NextResponse.json(
      {
        progressPercent: result.value.progressPercent,
        lastPositionSeconds: result.value.lastPositionSeconds,
        completed: result.value.completed,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof DomainError) return errorResponse(error);
    return internalError("saving progress failed", error);
  }
}
