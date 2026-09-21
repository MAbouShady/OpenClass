import { NextResponse, type NextRequest } from "next/server";
import { recordings, uploadRateLimiter } from "@/modules/recordings/infrastructure/container";
import { isCourseManager } from "@/modules/recordings/application/actor";
import { InvalidVideoFileError } from "@/modules/recordings/domain/errors";
import { sniffVideoContainer } from "@/modules/recordings/domain/video-file-type";
import { resolveRecordingActor } from "@/modules/recordings/infrastructure/recording-actor";
import {
  errorResponse,
  forbidden,
  internalError,
  tooManyRequests,
  unauthorized,
} from "@/modules/recordings/infrastructure/api-response";

/** Largest single chunk accepted, independent of the total file ceiling. */
const MAX_CHUNK_BYTES = 16 * 1024 * 1024;

/**
 * Enough of the first chunk to recognise a container. Anything shorter than
 * this cannot be judged yet and is left to the check at completion.
 */
const MIN_SNIFFABLE_BYTES = 12;

/** How many bytes have landed so far — lets an interrupted upload resume. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  const actor = await resolveRecordingActor();
  if (!actor) return unauthorized();
  if (!isCourseManager(actor)) return forbidden();

  const { uploadId } = await params;
  try {
    return NextResponse.json({
      uploadedBytes: await recordings.mediaStorage.uploadedBytes(uploadId),
    });
  } catch (error) {
    return internalError("upload status failed", error);
  }
}

/** Appends one chunk at the offset the client claims; the store rejects gaps. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  const actor = await resolveRecordingActor();
  if (!actor) return unauthorized();
  if (!isCourseManager(actor)) return forbidden();

  const key = `chunk:${actor.userId}`;
  if (!uploadRateLimiter.check(key)) {
    return tooManyRequests(uploadRateLimiter.retryAfterSeconds(key));
  }

  const { uploadId } = await params;
  const offset = Number(request.headers.get("x-chunk-offset") ?? "");
  if (!Number.isInteger(offset) || offset < 0) {
    return NextResponse.json({ error: "Missing or invalid chunk offset." }, { status: 400 });
  }

  try {
    const body = new Uint8Array(await request.arrayBuffer());
    if (body.byteLength === 0) {
      return NextResponse.json({ error: "Empty chunk." }, { status: 400 });
    }
    if (body.byteLength > MAX_CHUNK_BYTES) {
      // Coded so the client can tell "send me smaller pieces" apart from "this
      // file will never fit" — the first is retryable, the second is fatal.
      return NextResponse.json(
        { error: "Chunk too large.", code: "CHUNK_TOO_LARGE" },
        { status: 413 },
      );
    }
    if (offset + body.byteLength > recordings.maxBytes) {
      // Enforced per chunk as well as up front, so a client cannot talk its way
      // past the ceiling by lying about the size at init time.
      await recordings.mediaStorage.abortUpload(uploadId);
      return NextResponse.json(
        { error: "The file is too large.", code: "FILE_TOO_LARGE" },
        { status: 413 },
      );
    }

    // Judge the container on the opening bytes rather than waiting for the whole
    // file. The check at completion is the authoritative one and still runs;
    // this one exists so a teacher who picked the wrong file finds out in a
    // second instead of at the end of a two-gigabyte upload.
    if (offset === 0 && body.byteLength >= MIN_SNIFFABLE_BYTES) {
      if (!sniffVideoContainer(body.subarray(0, 64))) {
        await recordings.mediaStorage.abortUpload(uploadId);
        return errorResponse(
          new InvalidVideoFileError("The selected file is not a supported video."),
        );
      }
    }

    const uploadedBytes = await recordings.mediaStorage.appendChunk(uploadId, offset, body);
    return NextResponse.json({ uploadedBytes });
  } catch (error) {
    if (error instanceof Error && error.message.includes("offset mismatch")) {
      return NextResponse.json({ error: error.message, code: "OFFSET_MISMATCH" }, { status: 409 });
    }
    return internalError("chunk upload failed", error);
  }
}

/** Abandons an upload and removes its partial bytes. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  const actor = await resolveRecordingActor();
  if (!actor) return unauthorized();
  if (!isCourseManager(actor)) return forbidden();

  const { uploadId } = await params;
  try {
    await recordings.mediaStorage.abortUpload(uploadId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return internalError("upload abort failed", error);
  }
}
