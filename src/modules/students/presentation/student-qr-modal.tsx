"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type StudentQrModalProps = {
  readonly studentName: string;
  readonly idNumber: number | null;
};

const QR_SIZE = 256;
const PADDING = 16;
const ID_HEIGHT = 44;

async function buildCard(
  idNumber: number,
): Promise<{ dataUrl: string; canvasDataUrl: string }> {
  const QRCode = (await import("qrcode")).default;
  const dataUrl = await QRCode.toDataURL(String(idNumber), { width: QR_SIZE, margin: 2 });

  const canvas = document.createElement("canvas");
  canvas.width = QR_SIZE + PADDING * 2;
  canvas.height = QR_SIZE + PADDING * 2 + ID_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = dataUrl;
  });
  ctx.drawImage(img, PADDING, PADDING);

  ctx.fillStyle = "#000000";
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `#${idNumber}`,
    canvas.width / 2,
    PADDING + QR_SIZE + PADDING + ID_HEIGHT / 2,
  );

  return { dataUrl, canvasDataUrl: canvas.toDataURL("image/png") };
}

export function StudentQrModal({ studentName, idNumber }: StudentQrModalProps) {
  const t = useTranslations("students");
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<{ dataUrl: string; canvasDataUrl: string } | null>(null);
  const generated = useRef(false);

  useEffect(() => {
    if (!open || generated.current || idNumber === null) return;
    generated.current = true;
    void buildCard(idNumber).then(setCard);
  }, [open, idNumber]);

  // Reset when idNumber changes (student edited)
  useEffect(() => {
    generated.current = false;
    setCard(null);
  }, [idNumber]);

  function download() {
    if (!card) return;
    const a = document.createElement("a");
    a.download = `qr-${idNumber ?? studentName}.png`;
    a.href = card.canvasDataUrl;
    a.click();
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={() => setOpen(true)}
        disabled={idNumber === null}
        title={idNumber === null ? t("qrNotEnrolledTitle") : t("qrShowTitle")}
      >
        <QrCode className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("qrTitle")} — {studentName}</DialogTitle>
          </DialogHeader>

          {card === null ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              {t("qrGenerating")}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 pt-1">
              <div className="flex flex-col items-center rounded-xl border bg-white p-4 dark:bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.dataUrl} alt="QR code" width={200} height={200} />
                {idNumber !== null ? (
                  <p className="mt-2 font-mono text-xl font-bold text-black">#{idNumber}</p>
                ) : null}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={download}
              >
                <Download className="h-4 w-4" />
                {t("qrDownload")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
