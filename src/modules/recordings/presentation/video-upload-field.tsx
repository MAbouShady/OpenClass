"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Upload, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ALLOWED_VIDEO_MIME_TYPES } from "@/modules/recordings/domain/video-file-type";

/** 8 MiB keeps each request well inside proxy limits while staying efficient. */
const CHUNK_BYTES = 8 * 1024 * 1024;

type UploadState =
  | { readonly kind: "idle" }
  | { readonly kind: "uploading"; readonly percent: number }
  | { readonly kind: "done"; readonly filename: string }
  | { readonly kind: "error"; readonly message: string };

type VideoUploadFieldProps = {
  readonly name: string;
  readonly initialAssetId?: string | null;
  readonly initialFilename?: string | null;
};

/**
 * Resumable chunked uploader.
 *
 * Bytes go straight to a private storage endpoint in fixed-size chunks; the
 * form only ever carries the resulting asset id. No storage credentials or
 * paths are exposed to the browser.
 */
export function VideoUploadField({ name, initialAssetId, initialFilename }: VideoUploadFieldProps) {
  const t = useTranslations("recordings");
  const [assetId, setAssetId] = useState<string | null>(initialAssetId ?? null);
  const [state, setState] = useState<UploadState>(
    initialAssetId ? { kind: "done", filename: initialFilename ?? "" } : { kind: "idle" },
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleFile(file: File) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ kind: "uploading", percent: 0 });

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

      for (let offset = 0; offset < file.size; offset += CHUNK_BYTES) {
        const chunk = file.slice(offset, Math.min(offset + CHUNK_BYTES, file.size));
        const chunkResponse = await fetch(`/api/recorded-videos/uploads/${uploadId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/octet-stream",
            "x-chunk-offset": String(offset),
          },
          body: chunk,
          signal: controller.signal,
        });
        if (!chunkResponse.ok) {
          const failure = (await chunkResponse.json().catch(() => ({}))) as { error?: string };
          throw new Error(failure.error ?? t("uploadFailed"));
        }
        const { uploadedBytes } = (await chunkResponse.json()) as { uploadedBytes: number };
        setState({
          kind: "uploading",
          percent: Math.min(99, Math.round((uploadedBytes / file.size) * 100)),
        });
      }

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

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${name}-file`}>{t("videoLabel")}</Label>
      {assetId ? <input type="hidden" name={name} value={assetId} /> : null}

      <input
        ref={inputRef}
        id={`${name}-file`}
        type="file"
        accept={ALLOWED_VIDEO_MIME_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {state.kind === "uploading" ? (
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("uploading")}
            </span>
            <span className="font-medium tabular-nums">{state.percent}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={state.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${state.percent}%` }}
            />
          </div>
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
