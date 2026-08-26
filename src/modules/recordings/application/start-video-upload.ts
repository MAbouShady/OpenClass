import { err, ok, type Result } from "@/shared/domain/result";
import { z } from "zod";
import type { MediaStorage, UploadAuthorization } from "@/modules/recordings/domain/media-storage";
import type { InvalidVideoFileError } from "@/modules/recordings/domain/errors";
import { RecordedVideoForbiddenError } from "@/modules/recordings/domain/errors";
import { validateVideoUploadRequest } from "@/modules/recordings/domain/video-file-type";
import { isCourseManager, type RecordingActor } from "@/modules/recordings/application/actor";
import { startVideoUploadSchema } from "@/modules/recordings/application/recorded-video.schema";

export type StartVideoUploadDeps = {
  readonly mediaStorage: MediaStorage;
  readonly maxBytes: number;
  readonly newUploadId: () => string;
};

export type StartVideoUploadError = InvalidVideoFileError | RecordedVideoForbiddenError;

/**
 * Issues a temporary upload authorization. Nothing about the storage backend —
 * credentials, bucket, root path — crosses to the client; it only ever learns
 * an opaque upload id and where to send bytes.
 */
export async function startVideoUpload(
  deps: StartVideoUploadDeps,
  actor: RecordingActor,
  input: z.input<typeof startVideoUploadSchema>,
): Promise<Result<UploadAuthorization, StartVideoUploadError>> {
  if (!isCourseManager(actor)) {
    return err(new RecordedVideoForbiddenError());
  }

  const parsed = startVideoUploadSchema.parse(input);

  const validated = validateVideoUploadRequest({
    filename: parsed.filename,
    declaredMimeType: parsed.mimeType,
    sizeBytes: parsed.sizeBytes,
    maxBytes: deps.maxBytes,
  });
  if (validated instanceof Error) {
    return err(validated);
  }

  const uploadId = deps.newUploadId();
  await deps.mediaStorage.createUpload(uploadId);

  return ok({
    uploadId,
    uploadUrl: `/api/recorded-videos/uploads/${uploadId}`,
    strategy: "chunked-proxy",
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
  });
}
