import type { VideoAssetRepository } from "@/modules/recordings/domain/video-asset-repository";
import type { VideoProcessor } from "@/modules/recordings/domain/video-processor";
import { MAX_PROCESSING_ATTEMPTS } from "@/modules/recordings/domain/video-asset";

export type RunVideoProcessingDeps = {
  readonly videoAssetRepository: VideoAssetRepository;
  readonly videoProcessor: VideoProcessor;
};

export type RunVideoProcessingOutcome = "ready" | "failed" | "skipped";

/**
 * Executes one transcode. Runs in the background worker, never in a request.
 *
 * Guards on the stored status so two workers racing on the same asset cannot
 * both transcode it, and records a readable failure so the admin UI can offer
 * a retry.
 */
export async function runVideoProcessing(
  deps: RunVideoProcessingDeps,
  assetId: string,
): Promise<RunVideoProcessingOutcome> {
  const asset = await deps.videoAssetRepository.findById(assetId);
  if (!asset) return "skipped";
  if (asset.processingStatus !== "PENDING") return "skipped";
  if (asset.attempts >= MAX_PROCESSING_ATTEMPTS) {
    await deps.videoAssetRepository.update(assetId, {
      processingStatus: "FAILED",
      processingError: "Maximum processing attempts reached.",
    });
    return "failed";
  }

  await deps.videoAssetRepository.update(assetId, {
    processingStatus: "PROCESSING",
    processingStartedAt: new Date(),
    processingError: null,
    attempts: asset.attempts + 1,
  });

  try {
    const result = await deps.videoProcessor.process({
      assetId,
      originalKey: asset.originalKey,
    });

    await deps.videoAssetRepository.update(assetId, {
      processingStatus: "READY",
      durationSeconds: result.durationSeconds,
      width: result.width,
      height: result.height,
      hlsPrefix: result.hlsPrefix,
      thumbnailKey: result.thumbnailKey,
      processedAt: new Date(),
      processingError: null,
    });
    return "ready";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await deps.videoAssetRepository.update(assetId, {
      processingStatus: "FAILED",
      // Truncated, and surfaced only to course managers — never to students.
      processingError: message.slice(0, 500),
    });
    return "failed";
  }
}
