import { spawn } from "node:child_process";

export type RunCommandOptions = {
  readonly timeoutMs?: number;
};

/**
 * Runs a binary with an argument array — never a shell string — so filenames
 * can never be interpreted as shell syntax.
 */
export function runCommand(
  command: string,
  args: readonly string[],
  options: RunCommandOptions = {},
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 2 * 60 * 60 * 1000;

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, [...args], { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        child.kill("SIGKILL");
        settled = true;
        rejectPromise(new Error(`${command} timed out after ${timeoutMs}ms.`));
      }
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    // Keep only the tail: ffmpeg is extremely chatty and this string ends up in
    // an error column that admins read.
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-4000);
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      rejectPromise(
        new Error(`Failed to start "${command}". Is it installed and on PATH? (${error.message})`),
      );
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) {
        resolvePromise(stdout);
      } else {
        rejectPromise(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
      }
    });
  });
}

export type ProbeResult = {
  readonly durationSeconds: number;
  readonly width: number;
  readonly height: number;
  readonly hasAudio: boolean;
};

type FfprobeStream = {
  codec_type?: string;
  width?: number;
  height?: number;
};

type FfprobeOutput = {
  streams?: FfprobeStream[];
  format?: { duration?: string };
};

export async function probeVideo(ffprobePath: string, filePath: string): Promise<ProbeResult> {
  const raw = await runCommand(
    ffprobePath,
    ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", filePath],
    { timeoutMs: 60_000 },
  );

  const parsed = JSON.parse(raw) as FfprobeOutput;
  const streams = parsed.streams ?? [];
  const video = streams.find((stream) => stream.codec_type === "video");
  const hasAudio = streams.some((stream) => stream.codec_type === "audio");

  if (!video?.width || !video.height) {
    throw new Error("The file contains no decodable video stream.");
  }

  const duration = Number.parseFloat(parsed.format?.duration ?? "0");
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Could not determine the video duration.");
  }

  return {
    durationSeconds: Math.round(duration),
    width: video.width,
    height: video.height,
    hasAudio,
  };
}
