"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/shared/domain/action-state";

type SubmitPaymentFormProps = {
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

export function SubmitPaymentForm({ action }: SubmitPaymentFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [proofUrl, setProofUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "payment");

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };

      if (!res.ok || json.error) {
        setUploadError(json.error ?? "Upload failed.");
      } else if (json.url) {
        setProofUrl(json.url);
        setPreview(json.url);
      }
    } catch {
      setUploadError("Upload failed. Check connection.");
    } finally {
      setUploading(false);
    }
  }

  function removeScreenshot() {
    setProofUrl("");
    setPreview("");
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-3">
      <input type="hidden" name="proofUrl" value={proofUrl} />

      {preview ? (
        <div className="relative inline-block w-fit">
          <Image
            src={preview}
            alt="Payment screenshot"
            width={200}
            height={150}
            className="rounded-md border object-cover"
          />
          <button
            type="button"
            onClick={removeScreenshot}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload payment screenshot"}
          </Button>
        </div>
      )}

      {uploadError ? (
        <p className="text-sm text-destructive">{uploadError}</p>
      ) : null}

      <div>
        <Button type="submit" size="sm" disabled={pending || !proofUrl || uploading}>
          {pending ? "Submitting…" : "Submit payment"}
        </Button>
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state.message ? (
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
