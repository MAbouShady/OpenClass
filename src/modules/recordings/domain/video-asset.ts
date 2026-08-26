export const VIDEO_PROCESSING_STATUSES = [
  "UPLOADING",
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
] as const;

export type VideoProcessingStatus = (typeof VIDEO_PROCESSING_STATUSES)[number];

export type VideoAsset = {
  readonly id: string;
  readonly originalFilename: string;
  readonly originalKey: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly durationSeconds: number | null;
  readonly width: number | null;
  readonly height: number | null;
  /** Storage prefix holding master.m3u8 + variant playlists + segments. */
  readonly hlsPrefix: string | null;
  readonly thumbnailKey: string | null;
  readonly processingStatus: VideoProcessingStatus;
  readonly processingError: string | null;
  readonly processingStartedAt: Date | null;
  readonly processedAt: Date | null;
  readonly attempts: number;
  readonly uploadedById: string;
};

/** A processed asset can only be streamed once HLS output exists. */
export function isPlayable(asset: VideoAsset | null): boolean {
  return asset !== null && asset.processingStatus === "READY" && asset.hlsPrefix !== null;
}

/** Processing may only be retried from a terminal failure, or from a stuck run. */
export function canRetryProcessing(asset: VideoAsset): boolean {
  return asset.processingStatus === "FAILED" || asset.processingStatus === "PROCESSING";
}

export const MAX_PROCESSING_ATTEMPTS = 3;
