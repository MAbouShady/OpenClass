/**
 * Runs once per server instance, before the first request is served.
 *
 * Video processing has no external queue service, so the worker is recovered
 * here: anything the database still lists as PENDING (or stranded in PROCESSING
 * by a crash or redeploy) is put back on the in-process queue. Abandoned upload
 * staging directories are swept at the same time.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { env } = await import("@/shared/config/env");
  if (!env.VIDEO_WORKER_ENABLED) return;

  try {
    const { recordings } = await import("@/modules/recordings/infrastructure/container");
    await recordings.mediaStorage.sweepStaleUploads();
    await recordings.processingQueue.recoverPending(recordings.videoAssetRepository);
  } catch (error) {
    // A database that is not up yet must not stop the server from booting.
    console.error("[recordings] failed to recover pending video processing", error);
  }
}
