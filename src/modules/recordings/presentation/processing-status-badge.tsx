"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { VideoProcessingStatus } from "@/modules/recordings/domain/video-asset";

type ProcessingStatusBadgeProps = {
  readonly status: VideoProcessingStatus | null;
};

const VARIANT: Record<VideoProcessingStatus, "secondary" | "success" | "warning" | "destructive"> =
  {
    UPLOADING: "secondary",
    PENDING: "warning",
    PROCESSING: "warning",
    READY: "success",
    FAILED: "destructive",
  };

const LABEL_KEY: Record<VideoProcessingStatus, string> = {
  UPLOADING: "statusUploading",
  PENDING: "statusQueued",
  PROCESSING: "statusProcessing",
  READY: "statusReady",
  FAILED: "statusFailed",
};

export function ProcessingStatusBadge({ status }: ProcessingStatusBadgeProps) {
  const t = useTranslations("recordings");

  if (!status) {
    return <Badge variant="outline">{t("statusNoVideo")}</Badge>;
  }

  return <Badge variant={VARIANT[status]}>{t(LABEL_KEY[status])}</Badge>;
}
