import { NextResponse, type NextRequest } from "next/server";
import { DomainError } from "@/shared/domain/result";
import { startVideoUpload } from "@/modules/recordings/application/start-video-upload";
import { recordings, uploadRateLimiter } from "@/modules/recordings/infrastructure/container";
import { resolveRecordingActor } from "@/modules/recordings/infrastructure/recording-actor";
import {
  errorResponse,
  internalError,
  tooManyRequests,
  unauthorized,
} from "@/modules/recordings/infrastructure/api-response";

/** Opens a resumable upload. Returns an opaque upload id — never a storage path. */
export async function POST(request: NextRequest) {
  const actor = await resolveRecordingActor();
  if (!actor) return unauthorized();

  if (!uploadRateLimiter.check(`init:${actor.userId}`)) {
    return tooManyRequests(uploadRateLimiter.retryAfterSeconds(`init:${actor.userId}`));
  }

  try {
    const body: unknown = await request.json();
    const result = await startVideoUpload(recordings, actor, body as never);
    if (!result.ok) return errorResponse(result.error);

    return NextResponse.json({
      uploadId: result.value.uploadId,
      uploadUrl: result.value.uploadUrl,
      strategy: result.value.strategy,
      expiresAt: result.value.expiresAt.toISOString(),
      maxBytes: recordings.maxBytes,
    });
  } catch (error) {
    if (error instanceof DomainError) return errorResponse(error);
    return internalError("upload init failed", error);
  }
}
