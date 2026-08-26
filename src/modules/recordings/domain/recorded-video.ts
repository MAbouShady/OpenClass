export const RECORDED_VIDEO_STATUSES = ["DRAFT", "PUBLISHED"] as const;

export type RecordedVideoStatus = (typeof RECORDED_VIDEO_STATUSES)[number];

export type RecordedVideo = {
  readonly id: string;
  readonly courseId: string;
  readonly title: string;
  readonly description: string | null;
  readonly videoAssetId: string | null;
  readonly position: number;
  readonly status: RecordedVideoStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
