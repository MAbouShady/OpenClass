import type { VideoAsset, VideoProcessingStatus } from "@/modules/recordings/domain/video-asset";

export type PrismaVideoAssetRow = {
  id: string;
  originalFilename: string;
  originalKey: string;
  mimeType: string;
  sizeBytes: bigint;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  hlsPrefix: string | null;
  thumbnailKey: string | null;
  processingStatus: VideoProcessingStatus;
  processingError: string | null;
  processingStartedAt: Date | null;
  processedAt: Date | null;
  attempts: number;
  uploadedById: string;
};

/** BigInt sizes never leave the infrastructure layer — they do not serialize. */
export function toVideoAsset(row: PrismaVideoAssetRow): VideoAsset {
  return {
    id: row.id,
    originalFilename: row.originalFilename,
    originalKey: row.originalKey,
    mimeType: row.mimeType,
    sizeBytes: Number(row.sizeBytes),
    durationSeconds: row.durationSeconds,
    width: row.width,
    height: row.height,
    hlsPrefix: row.hlsPrefix,
    thumbnailKey: row.thumbnailKey,
    processingStatus: row.processingStatus,
    processingError: row.processingError,
    processingStartedAt: row.processingStartedAt,
    processedAt: row.processedAt,
    attempts: row.attempts,
    uploadedById: row.uploadedById,
  };
}
