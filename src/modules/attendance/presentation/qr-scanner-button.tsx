"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, X } from "lucide-react";

type Props = {
  onScan: (value: string) => void;
  label: string;
};

export function QrScannerButton({ onScan, label }: Props) {
  const t = useTranslations("attendance");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (!open) return;

    setError(null);
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        const backCamera = devices.find((d) =>
          /back|rear|environment/i.test(d.label),
        );
        const deviceId = backCamera?.deviceId ?? devices[0]?.deviceId;

        if (!deviceId && devices.length === 0) {
          setError("No camera found.");
          return;
        }

        return reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, err) => {
            if (result) {
              onScan(result.getText());
              setOpen(false);
            } else if (err && !(err.message?.includes("No MultiFormat"))) {
              // ignore continuous "not found" errors
            }
          },
        );
      })
      .then((controls) => {
        if (controls) controlsRef.current = controls;
      })
      .catch(() => setError("Could not access camera. Check permissions."));

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onScan]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        title={label}
      >
        <Camera size={16} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm w-[calc(100%-2rem)] sm:w-full p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera size={16} /> {label}
            </DialogTitle>
          </DialogHeader>

          {error ? (
            <p className="text-sm text-destructive text-center py-6">{error}</p>
          ) : (
            <div className="relative overflow-hidden rounded-xl bg-black aspect-square">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white/70 rounded-xl relative">
                  <span className="absolute -top-px -left-px w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <span className="absolute -top-px -right-px w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <span className="absolute -bottom-px -left-px w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <span className="absolute -bottom-px -right-px w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
              </div>
            </div>
          )}

          <Button variant="outline" onClick={() => setOpen(false)} className="w-full gap-2">
            <X size={14} /> {t("cancelScan")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
