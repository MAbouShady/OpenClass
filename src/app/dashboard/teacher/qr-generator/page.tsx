"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type QrCard = { id: number; dataUrl: string };

function generateRandomId(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

async function generateCards(count: number): Promise<QrCard[]> {
  const QRCode = (await import("qrcode")).default;
  const ids = Array.from({ length: count }, generateRandomId);
  return Promise.all(
    ids.map(async (id) => {
      const dataUrl = await QRCode.toDataURL(String(id), {
        width: 200,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      return { id, dataUrl };
    }),
  );
}

export default function QrGeneratorPage() {
  const t = useTranslations("qrGeneratorPage");
  const [input, setInput] = useState("");
  const [cards, setCards] = useState<QrCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    const count = parseInt(input.trim(), 10);
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      setError(t("errorInvalid"));
      return;
    }
    setError(null);
    setLoading(true);
    const result = await generateCards(count);
    setCards(result);
    setLoading(false);
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          header, aside, nav { display: none !important; }
          body { background: white; }
          main { padding: 0 !important; }
          .qr-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            padding: 0;
          }
          .qr-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="no-print flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("pageTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("pageSubtitle")}</p>
          </div>

          <div className="flex flex-col gap-2 max-w-xs">
            <Label htmlFor="count">{t("countLabel")}</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={500}
              placeholder={t("countPlaceholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="text-sm"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? t("generating") : t("generateBtn")}
            </Button>
            {cards.length > 0 && (
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                <Printer size={15} />
                {t("printBtn")}
              </Button>
            )}
          </div>
        </div>

        {cards.length > 0 && (
          <div className="qr-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="qr-card flex flex-col items-center gap-1 rounded-lg border bg-white p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.dataUrl} alt={`QR for ID ${card.id}`} width={160} height={160} />
                <span className="text-sm font-bold tracking-widest text-black">#{card.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
