import type { VideoProcessingQueue } from "@/modules/recordings/domain/video-processor";
import type { VideoAssetRepository } from "@/modules/recordings/domain/video-asset-repository";
import {
  runVideoProcessing,
  type RunVideoProcessingDeps,
} from "@/modules/recordings/application/run-video-processing";

/**
 * Background video work.
 *
 * The application has no queue service, so this is a deliberately small
 * in-process worker: a FIFO of asset ids drained one at a time off the request
 * path, plus a startup sweep that re-queues anything the database still lists
 * as unfinished. Durability lives in the database — the queue itself is only a
 * hint, and losing it costs nothing but a delay.
 *
 * `VideoProcessingQueue` is the seam: swapping in Redis/BullMQ or a separate
 * worker process means implementing this one interface.
 */
export class InProcessVideoQueue implements VideoProcessingQueue {
  private readonly pending: string[] = [];
  private readonly queued = new Set<string>();
  private running = false;

  constructor(
    private readonly deps: RunVideoProcessingDeps,
    private readonly concurrency: number = 1,
  ) {}

  enqueue(assetId: string): void {
    if (this.queued.has(assetId)) return;
    this.queued.add(assetId);
    this.pending.push(assetId);
    void this.drain();
  }

  /**
   * Re-queues assets left mid-flight by a crash or a redeploy. Anything stuck
   * in PROCESSING is reset to PENDING first, since no worker owns it any more.
   */
  async recoverPending(videoAssetRepository: VideoAssetRepository): Promise<void> {
    const stuck = await videoAssetRepository.findByStatus("PROCESSING");
    for (const asset of stuck) {
      await videoAssetRepository.update(asset.id, {
        processingStatus: "PENDING",
        processingError: null,
      });
    }

    const pending = await videoAssetRepository.findByStatus("PENDING");
    for (const asset of [...stuck, ...pending]) {
      this.enqueue(asset.id);
    }
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      while (this.pending.length > 0) {
        const batch = this.pending.splice(0, this.concurrency);
        await Promise.all(
          batch.map(async (assetId) => {
            try {
              await runVideoProcessing(this.deps, assetId);
            } catch (error) {
              // runVideoProcessing already records failures; this only catches
              // an infrastructure fault so the worker keeps draining.
              console.error(`[recordings] processing crashed for asset ${assetId}`, error);
            } finally {
              this.queued.delete(assetId);
            }
          }),
        );
      }
    } finally {
      this.running = false;
    }
  }
}
