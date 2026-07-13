"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Loader2, Trash2, X, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type PhotoUploadProps = {
  type: "photo" | "cover";
  currentUrl: string | null;
  onUpload: (url: string) => void;
  onDelete: () => void;
  label: string;
  hint?: string;
  className?: string;
};

export function PhotoUpload({ type, currentUrl, onUpload, onDelete, label, hint, className }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed.");
      setPreview(json.url);
      onUpload(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = () => {
    setPreview(null);
    setConfirming(false);
    onDelete();
  };

  const isCover = type === "cover";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>

      <div className={cn("relative", isCover ? "w-full" : "w-24")}>
        <button
          type="button"
          onClick={() => !confirming && inputRef.current?.click()}
          className={cn(
            "relative overflow-hidden border-2 border-dashed border-border bg-muted/30",
            "hover:border-primary/60 hover:bg-muted/50 transition-colors group",
            isCover ? "h-36 w-full rounded-xl" : "h-24 w-24 rounded-full",
          )}
        >
          {preview ? (
            <Image
              src={preview}
              alt={label}
              fill
              className={cn("object-cover", isCover ? "rounded-xl" : "rounded-full")}
              unoptimized
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 p-2">
              <Upload size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs text-muted-foreground text-center leading-tight">Upload</span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
              <Loader2 size={20} className="animate-spin text-white" />
            </div>
          )}

          {preview && !uploading && !confirming && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
              <span className="text-xs font-medium text-white">Change</span>
            </div>
          )}
        </button>

        {/* Delete button — shown when photo exists */}
        {preview && !uploading && !confirming && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            className={cn(
              "absolute flex items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md",
              "hover:bg-destructive/90 transition-colors",
              isCover ? "top-2 end-2 h-7 w-7" : "-top-1 -end-1 h-6 w-6",
            )}
            title="Remove photo"
          >
            <Trash2 size={isCover ? 13 : 11} />
          </button>
        )}

        {/* Inline confirmation overlay */}
        {confirming && (
          <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 z-10",
            isCover ? "rounded-xl" : "rounded-full",
          )}>
            <p className="text-xs font-semibold text-white">Remove photo?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmDelete}
                className="flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors"
              >
                <Check size={11} /> Yes, remove
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex items-center gap-1 rounded-md bg-white/20 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
              >
                <X size={11} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
