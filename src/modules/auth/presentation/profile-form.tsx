"use client";

import { useTransition, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { PhotoUpload } from "@/modules/auth/presentation/photo-upload";
import { useTranslations } from "next-intl";
import type { ActionState } from "@/shared/domain/action-state";
import { CheckCircle2 } from "lucide-react";

const ACCENT_PRESETS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#10b981", // emerald
  "#f59e0b", // amber
  "#0ea5e9", // sky
  "#ef4444", // red
  "#14b8a6", // teal
];

type ProfileFormDefaults = {
  readonly name: string;
  readonly bio: string | null;
  readonly photoUrl: string | null;
  readonly coverUrl: string | null;
  readonly coverOffsetY: number;
  readonly accentColor: string | null;
  readonly paymentDetails: string | null;
  readonly locale: string;
};

type ProfileFormProps = {
  readonly action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  readonly defaultValues: ProfileFormDefaults;
};

export function ProfileForm({ action, defaultValues }: ProfileFormProps) {
  const t = useTranslations("profile");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [photoUrl, setPhotoUrl] = useState(defaultValues.photoUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(defaultValues.coverUrl ?? "");
  const [coverOffsetY, setCoverOffsetY] = useState(defaultValues.coverOffsetY);
  const [accentColor, setAccentColor] = useState(defaultValues.accentColor ?? "#6366f1");
  const [bioHtml, setBioHtml] = useState(defaultValues.bio ?? "");
  const [paymentDetailsHtml, setPaymentDetailsHtml] = useState(defaultValues.paymentDetails ?? "");
  const [locale, setLocale] = useState<"en" | "ar">(
    defaultValues.locale === "ar" ? "ar" : "en",
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("bio", bioHtml);
    fd.set("paymentDetails", paymentDetailsHtml);
    fd.set("photoUrl", photoUrl);
    fd.set("coverUrl", coverUrl);
    fd.set("coverOffsetY", String(coverOffsetY));
    fd.set("accentColor", accentColor);
    fd.set("locale", locale);

    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await action({}, fd);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Cover photo */}
      <div className="flex flex-col gap-2">
        <PhotoUpload
          type="cover"
          currentUrl={defaultValues.coverUrl}
          offsetY={coverOffsetY}
          onUpload={setCoverUrl}
          onPositionChange={setCoverOffsetY}
          onDelete={() => { setCoverUrl(""); setCoverOffsetY(50); }}
          label={t("coverPhotoLabel")}
          hint={t("coverPhotoHint")}
          className="w-full"
        />
      </div>

      {/* Avatar + name row */}
      <div className="flex items-end gap-4">
        <PhotoUpload
          type="photo"
          currentUrl={defaultValues.photoUrl}
          onUpload={setPhotoUrl}
          onDelete={() => setPhotoUrl("")}
          label={t("profilePhotoLabel")}
        />
        <div className="flex-1 flex flex-col gap-1.5">
          <Label htmlFor="name">{t("nameLabel")}</Label>
          <Input id="name" name="name" defaultValue={defaultValues.name} required />
        </div>
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <Label>{t("bioLabel")}</Label>
        <RichTextEditor
          defaultValue={defaultValues.bio ?? ""}
          placeholder={t("bioPlaceholder")}
          onChange={setBioHtml}
        />
      </div>

      {/* Payment details */}
      <div className="flex flex-col gap-1.5">
        <Label>{t("paymentDetailsLabel")}</Label>
        <p className="text-xs text-muted-foreground -mt-1">{t("paymentDetailsHint")}</p>
        <RichTextEditor
          defaultValue={defaultValues.paymentDetails ?? ""}
          placeholder={t("paymentDetailsPlaceholder")}
          onChange={setPaymentDetailsHtml}
        />
      </div>

      {/* Accent color */}
      <div className="flex flex-col gap-2">
        <Label>{t("accentColorLabel")}</Label>
        <p className="text-xs text-muted-foreground -mt-1">{t("accentColorHint")}</p>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setAccentColor(color)}
              className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: accentColor === color ? "white" : "transparent",
                outline: accentColor === color ? `2px solid ${color}` : "none",
                outlineOffset: "2px",
              }}
              title={color}
            />
          ))}
          <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border hover:border-primary transition-colors" title="Custom color">
            <span className="text-[10px] font-bold text-muted-foreground">+</span>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="sr-only"
            />
          </label>
          <span className="text-xs text-muted-foreground font-mono">{accentColor}</span>
        </div>
      </div>

      {/* Page language */}
      <div className="flex flex-col gap-2">
        <Label>{t("pageLangLabel")}</Label>
        <p className="text-xs text-muted-foreground -mt-1">{t("pageLangHint")}</p>
        <div className="flex gap-3">
          {(["en", "ar"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLocale(lang)}
              className={[
                "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                locale === lang
                  ? "border-2 bg-muted"
                  : "border hover:bg-muted/50 text-muted-foreground",
              ].join(" ")}
              style={locale === lang ? { borderColor: accentColor } : undefined}
            >
              <span className="text-base leading-none">{lang === "en" ? "🇬🇧" : "🇸🇦"}</span>
              <span dir={lang === "ar" ? "rtl" : "ltr"}>
                {lang === "en" ? "English" : "العربية"}
              </span>
              {lang === "ar" && (
                <span className="text-[10px] text-muted-foreground">(RTL)</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saved && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={16} />
          {t("saved")}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? t("saving") : t("saveChanges")}
      </Button>
    </form>
  );
}
