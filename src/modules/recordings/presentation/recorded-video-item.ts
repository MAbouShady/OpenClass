import type { RecordedVideoStatus } from "@/modules/recordings/domain/recorded-video";
import type { VideoProcessingStatus } from "@/modules/recordings/domain/video-asset";
import type { RecordedVideoWithAsset } from "@/modules/recordings/domain/recorded-video-repository";

/** Flat, serializable shape handed from server components to the client tables. */
export type RecordedVideoItem = {
  readonly id: string;
  readonly courseId: string;
  readonly courseTitle: string;
  readonly title: string;
  readonly description: string | null;
  readonly position: number;
  readonly status: RecordedVideoStatus;
  readonly videoAssetId: string | null;
  readonly processingStatus: VideoProcessingStatus | null;
  readonly processingError: string | null;
  readonly originalFilename: string | null;
  readonly durationSeconds: number | null;
};

export function toRecordedVideoItem(
  video: RecordedVideoWithAsset,
  courseTitle: string,
): RecordedVideoItem {
  return {
    id: video.id,
    courseId: video.courseId,
    courseTitle,
    title: video.title,
    description: video.description,
    position: video.position,
    status: video.status,
    videoAssetId: video.videoAssetId,
    processingStatus: video.asset?.processingStatus ?? null,
    // Only ever populated for course managers — students never receive it.
    processingError: video.asset?.processingError ?? null,
    originalFilename: video.asset?.originalFilename ?? null,
    durationSeconds: video.asset?.durationSeconds ?? null,
  };
}

/** Clock readout. Zero is a real time, so it renders as 0:00, never as a dash. */
export function formatClock(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
}

/** Lesson length for lists, where an unknown duration is shown as a dash. */
export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  return formatClock(seconds);
}
