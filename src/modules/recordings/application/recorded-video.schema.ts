import { z } from "zod";
import { RECORDED_VIDEO_STATUSES } from "@/modules/recordings/domain/recorded-video";

const optionalDescription = z
  .string()
  .trim()
  .max(2000)
  .nullish()
  .transform((value) => (value ? value : null));

export const createRecordedVideoSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2).max(160),
  description: optionalDescription,
  videoAssetId: z
    .string()
    .min(1)
    .nullish()
    .transform((value) => value ?? null),
  status: z.enum(RECORDED_VIDEO_STATUSES).default("DRAFT"),
});

export type CreateRecordedVideoSchemaInput = z.input<typeof createRecordedVideoSchema>;

export const updateRecordedVideoSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().trim().min(2).max(160),
  description: optionalDescription,
  status: z.enum(RECORDED_VIDEO_STATUSES),
  position: z.coerce.number().int().min(1).optional(),
  videoAssetId: z
    .string()
    .min(1)
    .nullish()
    .transform((value) => value ?? null)
    .optional(),
});

export type UpdateRecordedVideoSchemaInput = z.input<typeof updateRecordedVideoSchema>;

export const setRecordedVideoStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(RECORDED_VIDEO_STATUSES),
});

export const recordedVideoIdSchema = z.object({ id: z.string().min(1) });

export const reorderRecordedVideosSchema = z.object({
  courseId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)).min(1).max(500),
});

export type ReorderRecordedVideosSchemaInput = z.infer<typeof reorderRecordedVideosSchema>;

export const startVideoUploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  // Optional on purpose. `file.type` is empty whenever the operating system has
  // no registry entry for the extension — routine on Windows for .mkv and .mov
  // — and requiring it here failed the upload before any validation could
  // explain why. The type is decided by sniffing the bytes at completion.
  mimeType: z.string().trim().max(120).optional().default(""),
  sizeBytes: z.coerce.number().int().positive(),
});

/** Longest plausible lesson; anything past this is clamped, not rejected. */
const MAX_POSITION_SECONDS = 24 * 60 * 60;

export const saveLessonProgressSchema = z.object({
  recordedVideoId: z.string().min(1),
  /**
   * Clamped rather than rejected. A player reporting a wild position (a seek
   * past the end, a NaN from a torn-down media element) is a normal client
   * bug, not something that should fail the request — and it gains nothing,
   * because the position is clamped again to the asset's real duration before
   * any progress is credited.
   */
  positionSeconds: z.coerce
    .number()
    .catch(0)
    .transform((value) =>
      Number.isFinite(value) ? Math.min(Math.max(value, 0), MAX_POSITION_SECONDS) : 0,
    ),
});
