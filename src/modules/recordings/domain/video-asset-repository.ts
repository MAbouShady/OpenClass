import type { VideoAsset, VideoProcessingStatus } from "@/modules/recordings/domain/video-asset";

export type CreateVideoAssetInput = {
  readonly originalFilename: string;
  readonly originalKey: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly uploadedById: string;
  readonly processingStatus: VideoProcessingStatus;
};

export type UpdateVideoAssetInput = {
  readonly originalKey?: string;
  readonly durationSeconds?: number | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly hlsPrefix?: string | null;
  readonly thumbnailKey?: string | null;
  readonly processingStatus?: VideoProcessingStatus;
  readonly processingError?: string | null;
  readonly processingStartedAt?: Date | null;
  readonly processedAt?: Date | null;
  readonly attempts?: number;
};

export interface VideoAssetRepository {
  findById(id: string): Promise<VideoAsset | null>;
  findByStatus(status: VideoProcessingStatus): Promise<VideoAsset[]>;
  create(input: CreateVideoAssetInput): Promise<VideoAsset>;
  update(id: string, input: UpdateVideoAssetInput): Promise<VideoAsset>;
  delete(id: string): Promise<void>;
}
