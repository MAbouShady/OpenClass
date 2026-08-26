import { NextResponse, type NextRequest } from "next/server";
import { DomainError } from "@/shared/domain/result";
import { completeVideoUpload } from "@/modules/recordings/application/complete-video-upload";
import { recordings } from "@/modules/recordings/infrastructure/container";
import { resolveRecordingActor } from "@/modules/recordings/infrastructure/recording-actor";
import {
  errorResponse,
  internalError,
  unauthorized,
} from "@/modules/recordings/infrastructure/api-response";

/**
 * Seals the upload: sniffs the bytes, stores them privately, creates the asset
 * and hands processing to the background worker. Returns immediately — the
 * request never waits for transcoding.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  const actor = await resolveRecordingActor();
  if (!actor) return unauthorized();

  const { uploadId } = await params;

  try {
    const body = (await request.json()) as { filename?: unknown };
    const filename = typeof body.filename === "string" ? body.filename : "video";

    const result = await completeVideoUpload(recordings, actor, { uploadId, filename });
    if (!result.ok) return errorResponse(result.error);

    return NextResponse.json({
      assetId: result.value.id,
      processingStatus: result.value.processingStatus,
      originalFilename: result.value.originalFilename,
      sizeBytes: result.value.sizeBytes,
    });
  } catch (error) {
    if (error instanceof DomainError) return errorResponse(error);
    return internalError("upload completion failed", error);
  }
}
