import { err, ok, type Result } from "@/shared/domain/result";
import type { MediaStorage } from "@/modules/recordings/domain/media-storage";
import type { VideoAssetRepository } from "@/modules/recordings/domain/video-asset-repository";
import type { VideoProcessingQueue } from "@/modules/recordings/domain/video-processor";
import type { VideoAsset } from "@/modules/recordings/domain/video-asset";
import {
  InvalidVideoFileError,
  RecordedVideoForbiddenError,
} from "@/modules/recordings/domain/errors";
import { originalVideoKey, sanitizeFilename } from "@/modules/recordings/domain/storage-keys";
import { sniffVideoContainer } from "@/modules/recordings/domain/video-file-type";
import { isCourseManager, type RecordingActor } from "@/modules/recordings/application/actor";

export type CompleteVideoUploadDeps = {
  readonly mediaStorage: MediaStorage;
  readonly videoAssetRepository: VideoAssetRepository;
  readonly processingQueue: VideoProcessingQueue;
  readonly maxBytes: number;
};

export type CompleteVideoUploadInput = {
  readonly uploadId: string;
  readonly filename: string;
};

export type CompleteVideoUploadError = InvalidVideoFileError | RecordedVideoForbiddenError;

/** Bytes read from the head of the upload for container sniffing. */
const SNIFF_BYTES = 32;

/**
 * Seals an upload: the received bytes are sniffed, moved to their permanent
 * private key, recorded as a VideoAsset, and handed to the background worker.
 * The HTTP request never waits for transcoding.
 */
export async function completeVideoUpload(
  deps: CompleteVideoUploadDeps,
  actor: RecordingActor,
  input: CompleteVideoUploadInput,
): Promise<Result<VideoAsset, CompleteVideoUploadError>> {
  if (!isCourseManager(actor)) {
    return err(new RecordedVideoForbiddenError());
  }

  const receivedBytes = await deps.mediaStorage.uploadedBytes(input.uploadId);
  if (receivedBytes <= 0) {
    await deps.mediaStorage.abortUpload(input.uploadId);
    return err(new InvalidVideoFileError("No data was received."));
  }
  if (receivedBytes > deps.maxBytes) {
    await deps.mediaStorage.abortUpload(input.uploadId);
    return err(new InvalidVideoFileError("The file is too large."));
  }

  // Content sniffing decides the type. The declared MIME type and the file
  // extension are both attacker-controlled and are never trusted here, so a
  // script renamed to .mp4 cannot be stored as a video.
  const head = await deps.mediaStorage.readUploadHead(input.uploadId, SNIFF_BYTES);
  const container = sniffVideoContainer(head);
  if (!container) {
    await deps.mediaStorage.abortUpload(input.uploadId);
    return err(new InvalidVideoFileError("The uploaded file is not a supported video."));
  }

  const asset = await deps.videoAssetRepository.create({
    originalFilename: sanitizeFilename(input.filename),
    // Placeholder: the real key needs the asset id, which the store assigns.
    originalKey: "",
    mimeType: container.mimeType,
    sizeBytes: receivedBytes,
    uploadedById: actor.userId,
    processingStatus: "UPLOADING",
  });

  const key = originalVideoKey(asset.id, container.extension);

  try {
    await deps.mediaStorage.finalizeUpload(input.uploadId, key);
  } catch (error) {
    await deps.videoAssetRepository.delete(asset.id);
    await deps.mediaStorage.abortUpload(input.uploadId);
    throw error;
  }

  const stored = await deps.videoAssetRepository.update(asset.id, {
    originalKey: key,
    processingStatus: "PENDING",
  });

  deps.processingQueue.enqueue(asset.id);

  return ok(stored);
}
