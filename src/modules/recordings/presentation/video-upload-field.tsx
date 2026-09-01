"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ALLOWED_VIDEO_EXTENSIONS,
  VIDEO_ACCEPT_ATTRIBUTE,
  extensionOf,
  sniffVideoContainer,
} from "@/modules/recordings/domain/video-file-type";

/**
 * Starting chunk size. Deliberately optimistic: it is cut down automatically
 * the first time a proxy refuses a body this large, so a network with a tight
 * `client_max_body_size` costs one wasted request rather than the whole upload.
 */
const INITIAL_CHUNK_BYTES = 8 * 1024 * 1024;

/** Floor for that back-off. Below this the overhead per chunk stops being worth it. */
const MIN_CHUNK_BYTES = 256 * 1024;

/**
 * The first chunk is deliberately small. The server judges the container on the
 * bytes it opens with, so a small opening chunk turns "your file is wrong" into
 * a one-second answer on any connection, instead of one that arrives after the
 * first full-size chunk has finished crawling uphill.
 */
const PROBE_CHUNK_BYTES = 256 * 1024;

/** Bytes read locally to recognise the container before anything is sent. */
const LOCAL_SNIFF_BYTES = 64;

/** Consecutive failures at one offset before the upload is called off. */
const MAX_CHUNK_ATTEMPTS = 5;

type UploadState =
  | { readonly kind: "idle" }
  | { readonly kind: "checking" }
  | {
      readonly kind: "uploading";
      readonly uploadedBytes: number;
      readonly totalBytes: number;
      readonly bytesPerSecond: number | null;
      readonly resuming: boolean;
      /** True once the server has taken and accepted the opening bytes. */
      readonly accepted: boolean;
    }
  | { readonly kind: "done"; readonly filename: string }
  | { readonly kind: "error"; readonly message: string };

type VideoUploadFieldProps = {
  readonly name: string;
  readonly initialAssetId?: string | null;
  readonly initialFilename?: string | null;
};

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

async function errorBodyOf(response: Response): Promise<{ error?: string; code?: string }> {
  return (await response.json().catch(() => ({}))) as { error?: string; code?: string };
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Rounds the estimate to whole units. A remaining time shown to the second is
 * false precision — the number moves with every passing truck on the line.
 */
function formatDuration(seconds: number, units: { h: string; m: string; s: string }): string {
  const total = Math.max(1, Math.round(seconds));
  if (total < 60) return `${total} ${units.s}`;

  const minutes = Math.round(total / 60);
  if (minutes < 60) return `${minutes} ${units.m}`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ${units.h}` : `${hours} ${units.h} ${rest} ${units.m}`;
}

/**
 * Resumable chunked uploader.
 *
 * Bytes go straight to a private storage endpoint in fixed-size chunks; the
 * form only ever carries the resulting asset id. No storage credentials or
 * paths are exposed to the browser.
 *
 * Every chunk is retried rather than abandoned. A single dropped request used
 * to fail the entire upload, which made the feature look broken on exactly the
 * connections that need chunking most: the uploader had no way to find out how
 * many bytes the server had actually kept, so it could not continue. It now
 * asks, and picks up from there.
 */
export function VideoUploadField({ name, initialAssetId, initialFilename }: VideoUploadFieldProps) {
  const t = useTranslations("recordings");
  const [assetId, setAssetId] = useState<string | null>(initialAssetId ?? null);
  const [state, setState] = useState<UploadState>(
    initialAssetId ? { kind: "done", filename: initialFilename ?? "" } : { kind: "idle" },
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /** Bytes the server confirms it holds. The only trustworthy resume point. */
  async function confirmedOffset(uploadId: string, signal: AbortSignal): Promise<number> {
    const response = await fetch(`/api/recorded-videos/uploads/${uploadId}`, { signal });
    if (!response.ok) throw new Error((await errorBodyOf(response)).error ?? t("uploadFailed"));
    const { uploadedBytes } = (await response.json()) as { uploadedBytes: number };
    return uploadedBytes;
  }

  async function sendChunks(file: File, uploadId: string, signal: AbortSignal): Promise<void> {
    let chunkBytes = PROBE_CHUNK_BYTES;
    let offset = 0;
    let attempts = 0;
    let accepted = false;

    // Smoothed rather than instantaneous, so the estimate does not lurch on one
    // slow chunk. Seeded by the first sample so it is useful immediately.
    let bytesPerSecond: number | null = null;
    let lastTick = Date.now();
    let lastBytes = 0;

    const publish = (uploadedBytes: number, resuming: boolean) => {
      setState({
        kind: "uploading",
        uploadedBytes,
        totalBytes: file.size,
        bytesPerSecond,
        resuming,
        accepted,
      });
    };

    publish(0, false);

    while (offset < file.size) {
      const chunk = file.slice(offset, Math.min(offset + chunkBytes, file.size));

      let response: Response;
      try {
        response = await fetch(`/api/recorded-videos/uploads/${uploadId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/octet-stream",
            "x-chunk-offset": String(offset),
          },
          body: chunk,
          signal,
        });
      } catch (error) {
        if (signal.aborted) throw error;
        attempts += 1;
        if (attempts > MAX_CHUNK_ATTEMPTS) throw new Error(t("uploadFailed"));
        publish(offset, true);
        await delay(1000 * attempts, signal);
        offset = await confirmedOffset(uploadId, signal);
        continue;
      }

      if (response.status === 413) {
        const body = await errorBodyOf(response);
        // A file over the ceiling is fatal; a body over the proxy's limit just
        // means this chunk was too ambitious. An unlabelled 413 comes from the
        // proxy itself, which never reaches the route — treat it as the latter.
        if (body.code === "FILE_TOO_LARGE") throw new Error(body.error ?? t("uploadFailed"));
        if (chunkBytes <= MIN_CHUNK_BYTES) throw new Error(body.error ?? t("uploadFailed"));
        chunkBytes = Math.max(MIN_CHUNK_BYTES, Math.floor(chunkBytes / 4));
        continue;
      }

      if (response.status === 429) {
        attempts += 1;
        if (attempts > MAX_CHUNK_ATTEMPTS) throw new Error(t("uploadFailed"));
        const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
        publish(offset, true);
        await delay(Math.min(30, Number.isFinite(retryAfter) ? retryAfter : 1) * 1000, signal);
        continue;
      }

      if (response.status === 409) {
        // The server and this client disagree about how far the upload got —
        // usually a chunk that landed after its response was lost. Its count wins.
        attempts += 1;
        if (attempts > MAX_CHUNK_ATTEMPTS) throw new Error(t("uploadFailed"));
        offset = await confirmedOffset(uploadId, signal);
        continue;
      }

      if (!response.ok) {
        throw new Error((await errorBodyOf(response)).error ?? t("uploadFailed"));
      }

      const { uploadedBytes } = (await response.json()) as { uploadedBytes: number };
      offset = uploadedBytes;
      attempts = 0;

      if (!accepted) {
        // The server sniffed the opening bytes and kept them, so the file is a
        // video it will accept. Past this point a failure is the network, not
        // the file. Ramp up to full-size chunks now the probe has paid off.
        accepted = true;
        chunkBytes = Math.max(chunkBytes, INITIAL_CHUNK_BYTES);
      }

      const now = Date.now();
      const elapsed = (now - lastTick) / 1000;
      if (elapsed >= 0.25) {
        const sample = (uploadedBytes - lastBytes) / elapsed;
        bytesPerSecond = bytesPerSecond === null ? sample : bytesPerSecond * 0.7 + sample * 0.3;
        lastTick = now;
        lastBytes = uploadedBytes;
      }

      publish(uploadedBytes, false);
    }
  }

  /**
   * Everything that can be known without the network, checked before the
   * network is touched. Returns the message to show, or null when the file
   * looks fine. Reading 64 bytes off a local file is instant at any file size,
   * so a teacher who picked a PDF or a half-downloaded video is told so
   * immediately rather than after watching a progress bar fill.
   */
  async function preflight(file: File): Promise<string | null> {
    if (file.size === 0) return t("fileEmpty");

    const extension = extensionOf(file.name);
    if (!ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
      return t("unsupportedExtension", { allowed: ALLOWED_VIDEO_EXTENSIONS.join(", ") });
    }

    let head: Uint8Array;
    try {
      head = new Uint8Array(await file.slice(0, LOCAL_SNIFF_BYTES).arrayBuffer());
    } catch {
      // The file moved or the drive went away between picking and reading it.
      return t("fileUnreadable");
    }

    // Same check the server runs, run here first purely for the speed of the
    // answer. The server still decides — this can be skipped, the server cannot.
    return sniffVideoContainer(head) ? null : t("notAVideo");
  }

  async function handleFile(file: File) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ kind: "checking" });

    const problem = await preflight(file);
    if (controller.signal.aborted) return;
    if (problem) {
      setState({ kind: "error", message: problem });
      return;
    }

    setState({
      kind: "uploading",
      uploadedBytes: 0,
      totalBytes: file.size,
      bytesPerSecond: null,
      resuming: false,
      accepted: false,
    });

    let uploadId: string | null = null;
    try {
      const initResponse = await fetch("/api/recorded-videos/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
        signal: controller.signal,
      });
      const init = (await initResponse.json()) as { uploadId?: string; error?: string };
      if (!initResponse.ok || !init.uploadId) {
        throw new Error(init.error ?? t("uploadFailed"));
      }
      uploadId = init.uploadId;

      await sendChunks(file, uploadId, controller.signal);

      const completeResponse = await fetch(`/api/recorded-videos/uploads/${uploadId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
        signal: controller.signal,
      });
      const completed = (await completeResponse.json()) as { assetId?: string; error?: string };
      if (!completeResponse.ok || !completed.assetId) {
        throw new Error(completed.error ?? t("uploadFailed"));
      }

      setAssetId(completed.assetId);
      setState({ kind: "done", filename: file.name });
    } catch (error) {
      if (controller.signal.aborted) {
        setState({ kind: "idle" });
        return;
      }
      if (uploadId) {
        void fetch(`/api/recorded-videos/uploads/${uploadId}`, { method: "DELETE" });
      }
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : t("uploadFailed"),
      });
    }
  }

  function reset() {
    abortRef.current?.abort();
    setAssetId(null);
    setState({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  const percent =
    state.kind === "uploading" && state.totalBytes > 0
      ? Math.min(99, Math.round((state.uploadedBytes / state.totalBytes) * 100))
      : 0;

  const remainingLabel = (() => {
    if (state.kind !== "uploading") return null;
    if (state.resuming) return t("uploadResuming");
    if (!state.bytesPerSecond || state.bytesPerSecond <= 0) return t("uploadEstimating");

    const remaining = (state.totalBytes - state.uploadedBytes) / state.bytesPerSecond;
    return t("uploadRemaining", {
      time: formatDuration(remaining, {
        h: t("unitHour"),
        m: t("unitMinute"),
        s: t("unitSecond"),
      }),
    });
  })();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${name}-file`}>{t("videoLabel")}</Label>
      {assetId ? <input type="hidden" name={name} value={assetId} /> : null}

      <input
        ref={inputRef}
        id={`${name}-file`}
        type="file"
        accept={VIDEO_ACCEPT_ATTRIBUTE}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {state.kind === "checking" ? (
        <div
          className="flex items-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span className="truncate">{t("checkingFile")}</span>
        </div>
      ) : null}

      {state.kind === "uploading" ? (
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span className="truncate">
                {state.accepted ? t("uploading") : t("uploadStarting")}
              </span>
            </span>
            <span className="font-medium tabular-nums">{percent}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground"
            aria-live="polite"
          >
            <span className="tabular-nums">
              {formatBytes(state.uploadedBytes)} / {formatBytes(state.totalBytes)}
              {state.bytesPerSecond && !state.resuming
                ? ` · ${formatBytes(state.bytesPerSecond)}/s`
                : ""}
            </span>
            <span className="tabular-nums">{remainingLabel}</span>
          </div>
          {state.accepted ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
              {t("uploadAccepted")}
            </p>
          ) : null}
          <Button type="button" variant="ghost" size="sm" className="self-start" onClick={reset}>
            <X className="h-3.5 w-3.5" />
            {t("cancelUpload")}
          </Button>
        </div>
      ) : null}

      {state.kind === "done" ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
          <span className="min-w-0 truncate">{state.filename || t("videoAttached")}</span>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            {t("replaceVideo")}
          </Button>
        </div>
      ) : null}

      {state.kind === "idle" ? (
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {t("uploadVideo")}
        </Button>
      ) : null}

      {state.kind === "error" ? (
        <div className="flex flex-col gap-2">
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={reset}>
            {t("tryAgain")}
          </Button>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">{t("videoHint")}</p>
    </div>
  );
}
