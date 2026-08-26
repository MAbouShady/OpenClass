import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "@/shared/config/env";
import type { MediaStorage } from "@/modules/recordings/domain/media-storage";
import type { ProcessedVideo, VideoProcessor } from "@/modules/recordings/domain/video-processor";
import { hlsPrefixKey, thumbnailKey } from "@/modules/recordings/domain/storage-keys";
import {
  probeVideo,
  runCommand,
  type ProbeResult,
} from "@/modules/recordings/infrastructure/ffmpeg";
import { planVariants, type Variant } from "@/modules/recordings/infrastructure/hls-ladder";

const SEGMENT_SECONDS = 6;
/** Keyframe cadence: segment length × 24 fps, so segments stay aligned across rungs. */
const GOP = SEGMENT_SECONDS * 24;

/**
 * FFmpeg-backed transcoder. Produces an adaptive-bitrate HLS ladder, a poster
 * frame and the authoritative duration, then publishes them into private
 * storage under the asset's prefix.
 */
export class FfmpegVideoProcessor implements VideoProcessor {
  constructor(
    private readonly storage: MediaStorage,
    private readonly ffmpegPath: string = env.FFMPEG_PATH,
    private readonly ffprobePath: string = env.FFPROBE_PATH,
  ) {}

  async process(input: { assetId: string; originalKey: string }): Promise<ProcessedVideo> {
    const source = await this.storage.materialize(input.originalKey);
    const workDir = await mkdtemp(join(tmpdir(), `openclass-hls-${input.assetId}-`));

    try {
      const probe = await probeVideo(this.ffprobePath, source.path);
      const variants = planVariants(probe.width, probe.height);

      const hlsDir = join(workDir, "hls");
      await mkdir(hlsDir, { recursive: true });
      await Promise.all(
        variants.map((_, index) => mkdir(join(hlsDir, `v${index}`), { recursive: true })),
      );

      await runCommand(this.ffmpegPath, buildHlsArgs(source.path, hlsDir, variants, probe));

      const posterPath = join(workDir, "thumbnail.jpg");
      await runCommand(this.ffmpegPath, buildThumbnailArgs(source.path, posterPath, probe), {
        timeoutMs: 120_000,
      });

      const hlsPrefix = hlsPrefixKey(input.assetId);
      const posterKey = thumbnailKey(input.assetId);

      await this.storage.putDirectory(hlsDir, hlsPrefix);
      await this.storage.putObject(posterKey, new Uint8Array(await readFile(posterPath)));

      return {
        durationSeconds: probe.durationSeconds,
        width: probe.width,
        height: probe.height,
        hlsPrefix,
        thumbnailKey: posterKey,
      };
    } finally {
      await rm(workDir, { recursive: true, force: true });
      await source.cleanup();
    }
  }
}

function buildHlsArgs(
  sourcePath: string,
  hlsDir: string,
  variants: readonly Variant[],
  probe: ProbeResult,
): string[] {
  const splits = variants.map((_, index) => `[vsrc${index}]`).join("");
  const scaleChain = variants
    .map((variant, index) => `[vsrc${index}]scale=${variant.width}:${variant.height}[v${index}]`)
    .join(";");
  const filterComplex = `[0:v]split=${variants.length}${splits};${scaleChain}`;

  const args: string[] = ["-y", "-i", sourcePath, "-filter_complex", filterComplex];

  // All video maps first, then all audio maps: -var_stream_map indexes streams
  // by their position within each type.
  variants.forEach((variant, index) => {
    args.push(
      "-map",
      `[v${index}]`,
      `-c:v:${index}`,
      "libx264",
      `-preset:v:${index}`,
      "veryfast",
      `-profile:v:${index}`,
      "main",
      `-crf:v:${index}`,
      "21",
      `-maxrate:v:${index}`,
      `${variant.videoBitrateKbps}k`,
      `-bufsize:v:${index}`,
      `${variant.videoBitrateKbps * 2}k`,
    );
  });

  if (probe.hasAudio) {
    variants.forEach((variant, index) => {
      args.push(
        "-map",
        "a:0",
        `-c:a:${index}`,
        "aac",
        `-b:a:${index}`,
        `${variant.audioBitrateKbps}k`,
        `-ac:a:${index}`,
        "2",
      );
    });
  }

  const streamMap = variants
    .map((_, index) => (probe.hasAudio ? `v:${index},a:${index}` : `v:${index}`))
    .join(" ");

  args.push(
    "-g",
    String(GOP),
    "-keyint_min",
    String(GOP),
    "-sc_threshold",
    "0",
    "-f",
    "hls",
    "-hls_time",
    String(SEGMENT_SECONDS),
    "-hls_playlist_type",
    "vod",
    "-hls_flags",
    "independent_segments",
    "-hls_segment_filename",
    join(hlsDir, "v%v", "segment-%03d.ts"),
    "-master_pl_name",
    "master.m3u8",
    "-var_stream_map",
    streamMap,
    join(hlsDir, "v%v", "playlist.m3u8"),
  );

  return args;
}

function buildThumbnailArgs(sourcePath: string, outputPath: string, probe: ProbeResult): string[] {
  // A frame a tenth of the way in, capped at 10s — avoids black leader frames.
  const offset = Math.min(10, Math.max(1, Math.floor(probe.durationSeconds / 10)));
  return [
    "-y",
    "-ss",
    String(offset),
    "-i",
    sourcePath,
    "-frames:v",
    "1",
    "-vf",
    "scale=640:-2",
    "-q:v",
    "4",
    outputPath,
  ];
}
