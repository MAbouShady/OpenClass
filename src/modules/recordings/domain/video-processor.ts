export type ProcessedVideo = {
  readonly durationSeconds: number;
  readonly width: number;
  readonly height: number;
  /** Storage prefix that now contains master.m3u8 and its variants. */
  readonly hlsPrefix: string;
  readonly thumbnailKey: string;
};

/**
 * Transcoding port. Implementations are expected to be slow and are never
 * called from a request path — only from the background worker.
 */
export interface VideoProcessor {
  process(input: {
    readonly assetId: string;
    readonly originalKey: string;
  }): Promise<ProcessedVideo>;
}

/** Dispatch port for background video work. */
export interface VideoProcessingQueue {
  enqueue(assetId: string): void;
}
