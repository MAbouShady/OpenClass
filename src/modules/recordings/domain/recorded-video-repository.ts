import type {
  RecordedVideo,
  RecordedVideoStatus,
} from "@/modules/recordings/domain/recorded-video";
import type { VideoAsset } from "@/modules/recordings/domain/video-asset";

export type CreateRecordedVideoInput = {
  readonly courseId: string;
  readonly title: string;
  readonly description: string | null;
  readonly videoAssetId: string | null;
  readonly position: number;
  readonly status: RecordedVideoStatus;
};

export type UpdateRecordedVideoInput = {
  readonly title?: string;
  readonly description?: string | null;
  readonly courseId?: string;
  readonly position?: number;
  readonly status?: RecordedVideoStatus;
  readonly videoAssetId?: string | null;
};

/** A recorded video joined with its asset — the shape every list/detail view needs. */
export type RecordedVideoWithAsset = RecordedVideo & {
  readonly asset: VideoAsset | null;
};

export interface RecordedVideoRepository {
  findById(id: string): Promise<RecordedVideoWithAsset | null>;
  findByCourse(courseId: string): Promise<RecordedVideoWithAsset[]>;
  findPublishedByCourse(courseId: string): Promise<RecordedVideoWithAsset[]>;
  findAll(): Promise<RecordedVideoWithAsset[]>;
  findByAssetId(assetId: string): Promise<RecordedVideoWithAsset | null>;
  nextPosition(courseId: string): Promise<number>;
  create(input: CreateRecordedVideoInput): Promise<RecordedVideo>;
  update(id: string, input: UpdateRecordedVideoInput): Promise<RecordedVideo>;
  delete(id: string): Promise<void>;
  /**
   * Persist an explicit order for one course and renumber it to a dense 1..n
   * sequence, atomically. Ordering never depends on createdAt.
   */
  applyOrder(courseId: string, orderedIds: readonly string[]): Promise<void>;
  /** Close the gap left behind after a video leaves `courseId`. */
  compactPositions(courseId: string): Promise<void>;
}
